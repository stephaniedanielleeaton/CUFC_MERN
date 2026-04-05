import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { EmailList } from '../models/EmailList';
import { SendToListRequest, SendToListResult } from '@cufc/shared';
import { applyTemplate, DEFAULT_TEMPLATE, EmailTemplateType } from '../templates/emailTemplates';

type SentMessageInfo = nodemailer.SentMessageInfo;

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly BATCH_SIZE = 25;
  private readonly BATCH_DELAY_MS = 2000;

  async sendEmailToList(request: SendToListRequest): Promise<SendToListResult> {
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

    const templateName = (template as EmailTemplateType) ?? DEFAULT_TEMPLATE;
    const formattedMessage = applyTemplate(message, templateName);

    const batchStats = await this.processAllBatches(
      transporter,
      allowedEmails,
      subject,
      formattedMessage
    );

    const result = this.buildSendResult(batchStats, blockedEmails);
    return result;
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
        failures.push({
          email: batchEmails[index],
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
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
    formattedMessage: string
  ): Promise<{ successCount: number; failureCount: number; failures: { email: string; error: string }[] }> {
    const failures: { email: string; error: string }[] = [];
    let successCount = 0;
    let failureCount = 0;
    let batchNumber = 1;
    const totalBatches = Math.ceil(allowedEmails.length / this.BATCH_SIZE);

    for (let i = 0; i < allowedEmails.length; i += this.BATCH_SIZE) {
      const batch = allowedEmails.slice(i, i + this.BATCH_SIZE);
      console.log(`Processing batch ${batchNumber}/${totalBatches}, size: ${batch.length}`);

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

      await this.delayBetweenBatches(batchNumber, totalBatches);
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
