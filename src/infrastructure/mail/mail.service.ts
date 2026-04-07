import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('MAIL_HOST', 'localhost'),
      port: config.get<number>('MAIL_PORT', 1025),
      auth: config.get('MAIL_USER')
        ? { user: config.get('MAIL_USER'), pass: config.get('MAIL_PASS') }
        : undefined,
    });
  }

  async send(options: SendMailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.config.get('MAIL_FROM_NAME', 'ERP')}" <${this.config.get('MAIL_FROM', 'noreply@erp.local')}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });
      this.logger.debug(`Email sent to: ${options.to}`);
    } catch (err) {
      this.logger.error('Failed to send email', err);
      throw err;
    }
  }

  async sendPasswordReset(to: string, token: string, name: string): Promise<void> {
    const resetUrl = `${this.config.get('APP_URL')}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Recuperação de Senha - ERP',
      html: `
        <h2>Olá, ${name}!</h2>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para redefinir:</p>
        <a href="${resetUrl}" style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">
          Redefinir Senha
        </a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou, ignore este e-mail.</p>
      `,
    });
  }

  async sendWelcome(to: string, name: string, tempPassword?: string): Promise<void> {
    await this.send({
      to,
      subject: 'Bem-vindo ao ERP',
      html: `
        <h2>Bem-vindo, ${name}!</h2>
        <p>Sua conta foi criada com sucesso.</p>
        ${tempPassword ? `<p>Sua senha temporária é: <strong>${tempPassword}</strong></p><p>Por favor, altere-a no primeiro acesso.</p>` : ''}
        <p>Acesse o sistema em: <a href="${this.config.get('APP_URL')}">${this.config.get('APP_URL')}</a></p>
      `,
    });
  }
}
