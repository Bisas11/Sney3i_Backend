import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  private async send(to: string, subject: string, text: string): Promise<void> {
    const host =
      this.configService.get<string>('MAIL_HOST') || this.configService.get<string>('SMTP_HOST');
    const portValue =
      this.configService.get<string>('MAIL_PORT') || this.configService.get<string>('SMTP_PORT');
    const port = portValue ? Number(portValue) : undefined;
    const secureValue =
      this.configService.get<string>('MAIL_SECURE') || this.configService.get<string>('SMTP_SECURE');
    const secure = secureValue === 'true' || secureValue === '1' || secureValue === 'true';
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    const from = this.configService.get<string>('MAIL_FROM');

    if (!host || !user || !pass || !from || !portValue || !port) {
      this.logger.warn(`Mail config missing; simulated email to ${to}: ${subject}`);
      return;
    }

    const transportOptions: any = {
      host,
      port,
      secure: Boolean(secure),
      auth: { user, pass },
    };

    // For Gmail, TLS is recommended on port 587 with secure=false and STARTTLS
    if (host.includes('gmail')) {
      transportOptions.secure = secure; // usually false for port 587
      transportOptions.tls = { rejectUnauthorized: false };
    }

    const transport = nodemailer.createTransport(transportOptions);

    try {
      await transport.sendMail({ from, to, subject, text });
    } catch (err) {
      this.logger.error(`Failed to send mail to ${to}: ${err?.message || err}`);
      throw err;
    }
  }

  async sendVerificationEmail(to: string, token: string, appUrl: string): Promise<void> {
    await this.send(to, 'Verify your account', `${appUrl}/auth/verify-email?token=${token}`);
  }

  async sendPasswordResetEmail(to: string, token: string, appUrl: string): Promise<void> {
    await this.send(to, 'Reset your password', `${appUrl}/reset-password?token=${token}`);
  }

  async sendNotification(to: string, subject: string, message: string): Promise<void> {
    await this.send(to, subject, message);
  }
}