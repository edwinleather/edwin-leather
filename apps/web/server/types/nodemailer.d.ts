declare module "nodemailer" {
  interface TransportOptions {
    service?: string;
    auth?: { user: string; pass: string };
    secure?: boolean;
    pool?: boolean;
    maxConnections?: number;
    rateDelta?: number;
    rateLimit?: number;
    host?: string;
    port?: number;
  }

  interface SendMailOptions {
    from?: string;
    to?: string;
    cc?: string | string[];
    subject?: string;
    html?: string;
    text?: string;
    replyTo?: string;
    headers?: Record<string, string>;
  }

  interface Transporter {
    sendMail(options: SendMailOptions): Promise<{ messageId: string }>;
  }

  function createTransport(options: TransportOptions): Transporter;
}
