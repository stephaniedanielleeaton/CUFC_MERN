import nodemailer from 'nodemailer';
import { EventEmitter } from 'node:events';
import { env } from '../config/env';
import { EmailList } from '../models/EmailList';
import { SendToListRequest, SendToListResult } from '@cufc/shared';
import { applyTemplate, DEFAULT_TEMPLATE, EmailTemplateType } from '../templates/emailTemplates';

type SentMessageInfo = nodemailer.SentMessageInfo;

export interface BatchProgress {
  batchNumber: number;
  totalBatches: number;
  batchSize: number;
  successCount: number;
  failureCount: number;
  totalProcessed: number;
  totalEmails: number;
  failures: { email: string; error: string }[];
  status: 'processing' | 'completed' | 'error';
}

class EmailService extends EventEmitter {
  private transporter: nodemailer.Transporter | null = null;
  private readonly BATCH_SIZE = 25;
  private readonly BATCH_DELAY_MS = 2000;
  private readonly activeJobs: Map<string, BatchProgress> = new Map();

  async sendEmailToList(request: SendToListRequest, jobId?: string): Promise<SendToListResult> {
    const { emailListIds, additionalEmails, subject, message, template } = request;

    const emailsFromLists = await this.collectEmailsFromLists(emailListIds);
    this.addManualEmails(emailsFromLists, additionalEmails);

    const doNotContactEmails = await this.fetchDoNotContactEmails();
    const { allowedEmails, blockedEmails } = this.separateAllowedAndBlockedEmails(
      emailsFromLists,
      doNotContactEmails
    );

    const transporter = await this.getTransporter();
    const failures: { email: string; error: string }[] = [];

    let successCount = 0;
    let failureCount = 0;

    let batchNumber = 1;
    const totalBatches = Math.ceil(allowedEmails.length / this.BATCH_SIZE);
    const totalEmails = allowedEmails.length;

    const templateName = (template as EmailTemplateType) ?? DEFAULT_TEMPLATE;
    const formattedMessage = applyTemplate(message, templateName);

    if (jobId) {
      this.activeJobs.set(jobId, {
        batchNumber: 0,
        totalBatches,
        batchSize: this.BATCH_SIZE,
        successCount: 0,
        failureCount: 0,
        totalProcessed: 0,
        totalEmails,
        failures: [],
        status: 'processing'
      });
    }

    const batchStats = await this.processAllBatches(
      transporter,
      allowedEmails,
      subject,
      formattedMessage,
      jobId,
      totalBatches,
      totalEmails
    );

    if (jobId) {
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'completed';
        this.activeJobs.set(jobId, job);
        this.emit('progress', { jobId, ...job });
      }
    }

    const result = this.buildSendResult(batchStats, blockedEmails);
    return result;
  }

  getJobProgress(jobId: string): BatchProgress | undefined {
    return this.activeJobs.get(jobId);
  }

  async sendAlertEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      const mailOptions = this.createMailOptions(subject, htmlContent, to);
      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Alert email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send alert email:', error);
      return false;
    }
  }

  private updateJobProgress(jobId: string, progress: Partial<BatchProgress>) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      Object.assign(job, progress);
      this.activeJobs.set(jobId, job);
      this.emit('progress', { jobId, ...job });
    }
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_ACCOUNT,
        pass: env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
    });

    return this.transporter;
  }

  private async collectEmailsFromLists(emailListIds: string[] | undefined): Promise<Set<string>> {
    const emails = new Set<string>();
    if (!emailListIds || emailListIds.length === 0) {
      return emails;
    }

    const lists = await EmailList.find({ id: { $in: emailListIds } });
    for (const list of lists) {
      for (const email of list.emails) {
        emails.add(email.toLowerCase());
      }
    }
    return emails;
  }

  private addManualEmails(emails: Set<string>, additionalEmails: string[] | undefined): void {
    if (!additionalEmails || additionalEmails.length === 0) {
      return;
    }
    for (const email of additionalEmails) {
      emails.add(email.toLowerCase());
    }
  }

  private async fetchDoNotContactEmails(): Promise<Set<string>> {
    try {
      const doNotContactList = await EmailList.findOne({ id: 'do-not-contact' });
      if (doNotContactList) {
        return new Set(doNotContactList.emails.map(e => e.toLowerCase()));
      }
    } catch (error) {
      console.log('Note: Could not fetch do-not-contact list:', error);
    }
    return new Set<string>();
  }

  private separateAllowedAndBlockedEmails(
    allEmails: Set<string>,
    doNotContactEmails: Set<string>
  ): { allowedEmails: string[]; blockedEmails: string[] } {
    const blockedEmails: string[] = [];
    const allowedEmails: string[] = [];

    for (const email of allEmails) {
      if (doNotContactEmails.has(email)) {
        blockedEmails.push(email);
      } else {
        allowedEmails.push(email);
      }
    }

    return { allowedEmails, blockedEmails };
  }

  private createMailOptions(subject: string, htmlContent: string, to: string) {
    return {
      from: env.EMAIL_ACCOUNT,
      to,
      subject,
      html: htmlContent,
    };
  }

  private async sendBatch(
    transporter: nodemailer.Transporter,
    batch: string[],
    subject: string,
    message: string
  ): Promise<PromiseSettledResult<SentMessageInfo>[]> {
    return Promise.allSettled(
      batch.map(email => {
        const mailOptions = this.createMailOptions(subject, message, email);
        return transporter.sendMail(mailOptions);
      })
    );
  }

  private processBatchResults(
    batchResults: PromiseSettledResult<SentMessageInfo>[],
    batchEmails: string[],
    successCount: number,
    failureCount: number,
    failures: { email: string; error: string }[]
  ): { newSuccessCount: number; newFailureCount: number } {
    let currentSuccessCount = 0;
    let currentFailureCount = 0;

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        currentSuccessCount++;
      } else {
        currentFailureCount++;
        const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.error(`Failed to send to ${batchEmails[index]}: ${errorMsg}`);
        failures.push({
          email: batchEmails[index],
          error: errorMsg
        });
      }
    });

    return {
      newSuccessCount: successCount + currentSuccessCount,
      newFailureCount: failureCount + currentFailureCount
    };
  }

  private async delayBetweenBatches(batchNumber: number, totalBatches: number): Promise<void> {
    const isLastBatch = batchNumber === totalBatches;
    if (isLastBatch) {
      return;
    }
    console.log(`Waiting ${this.BATCH_DELAY_MS}ms before next batch...`);
    await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY_MS));
  }

  private async processAllBatches(
    transporter: nodemailer.Transporter,
    allowedEmails: string[],
    subject: string,
    formattedMessage: string,
    jobId?: string,
    totalBatches?: number,
    totalEmails?: number
  ): Promise<{ successCount: number; failureCount: number; failures: { email: string; error: string }[] }> {
    const failures: { email: string; error: string }[] = [];
    let successCount = 0;
    let failureCount = 0;
    let batchNumber = 1;
    const calculatedTotalBatches = totalBatches ?? Math.ceil(allowedEmails.length / this.BATCH_SIZE);
    const calculatedTotalEmails = totalEmails ?? allowedEmails.length;

    for (let i = 0; i < allowedEmails.length; i += this.BATCH_SIZE) {
      const batch = allowedEmails.slice(i, i + this.BATCH_SIZE);
      console.log(`Processing batch ${batchNumber}/${calculatedTotalBatches}, size: ${batch.length}`);

      if (jobId) {
        this.updateJobProgress(jobId, {
          batchNumber,
          totalBatches: calculatedTotalBatches,
          batchSize: batch.length,
          status: 'processing'
        });
      }

      const batchResults = await this.sendBatch(transporter, batch, subject, formattedMessage);

      const counts = this.processBatchResults(
        batchResults,
        batch,
        successCount,
        failureCount,
        failures
      );
      successCount = counts.newSuccessCount;
      failureCount = counts.newFailureCount;

      if (jobId) {
        this.updateJobProgress(jobId, {
          batchNumber,
          successCount,
          failureCount,
          totalProcessed: successCount + failureCount,
          totalEmails: calculatedTotalEmails,
          failures: [...failures]
        });
      }

      await this.delayBetweenBatches(batchNumber, calculatedTotalBatches);
      batchNumber++;
    }

    return { successCount, failureCount, failures };
  }

  private buildSendResult(
    batchStats: { successCount: number; failureCount: number; failures: { email: string; error: string }[] },
    blockedEmails: string[]
  ): SendToListResult {
    return {
      success: batchStats.failureCount === 0,
      message: `Completed: ${batchStats.successCount} successful, ${batchStats.failureCount} failed`,
      successCount: batchStats.successCount,
      failureCount: batchStats.failureCount,
      failures: batchStats.failures,
      blockedEmails
    };
  }
}

export const emailService = new EmailService();
