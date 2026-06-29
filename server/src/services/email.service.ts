import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Cache the transporter instance to reuse TCP connections across requests
let transporterInstance: nodemailer.Transporter | null = null;

/**
 * Creates a reusable transporter object using default SMTP settings.
 * Includes connection pooling configurations for high-performance enterprise delivery.
 */
const createTransporter = (): nodemailer.Transporter => {
  const hasAuth = 
    env.EMAIL_USER && 
    env.EMAIL_USER !== 'replace_me' && 
    env.EMAIL_PASS && 
    env.EMAIL_PASS !== 'replace_me';

  const transportConfig: any = {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    pool: true,             // Enable connection pooling
    maxConnections: 5,      // Limit simultaneous connections
    maxMessages: 100,       // Max messages per connection
    rateLimit: 10,          // Throttle to maximum 10 messages per second
  };

  if (hasAuth) {
    transportConfig.auth = {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    };
  }

  return nodemailer.createTransport(transportConfig);
};

/**
 * Retrieves the cached SMTP transporter instance.
 */
const getTransporter = (): nodemailer.Transporter => {
  if (!transporterInstance) {
    transporterInstance = createTransporter();
  }
  return transporterInstance;
};

/**
 * Email Service.
 * Dispatches verification links and password recovery steps to real email inboxes via SMTP.
 * Throws errors upon failure to guarantee reliable, traceable transactions.
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const transporter = getTransporter();
    
    await transporter.sendMail({
      from: `"${env.EMAIL_FROM.split('@')[0]}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    console.log(`[SMTP EMAIL] Dispatched email successfully to: ${to}`);
  } catch (err: any) {
    console.error(`[SMTP EMAIL ERROR] Failed to deliver email to ${to}:`, err.message || err);
    throw err; // Propagate error to caller to ensure transaction reliability
  }
};

export default sendEmail;
