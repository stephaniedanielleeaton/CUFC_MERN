import nodemailer from 'nodemailer';
import { env } from '../config/env';

interface ContactFormData {
  fullName: string;
  emailAddress: string;
  contactNumber?: string;
  message: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

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

  async sendContactEmail(formData: ContactFormData): Promise<void> {
    const emailContent = `
New Contact Form Submission

Contact Information:
• Name: ${formData.fullName}
• Email: ${formData.emailAddress}

Message:
${formData.message}`;

    const mailOptions = {
      from: env.EMAIL_ACCOUNT,
      to: env.EMAIL_ACCOUNT,
      subject: 'New Contact Form Submission - CUFC',
      text: emailContent,
      replyTo: formData.emailAddress,
    };

    const transporter = await this.getTransporter();
    await transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
