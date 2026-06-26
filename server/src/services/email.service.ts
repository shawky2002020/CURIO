import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let testAccount: any = null;
let cachedTransporter: nodemailer.Transporter | null = null;

/**
 * Creates or retrieves the SMTP transporter.
 * If no custom SMTP credentials are found in development, it automatically
 * provisions a real, temporary SMTP account via Ethereal Email.
 */
const getTransporter = async (): Promise<nodemailer.Transporter | null> => {
  const isSmtpConfigured = 
    env.EMAIL_USER && 
    env.EMAIL_USER !== 'replace_me' && 
    env.EMAIL_PASS && 
    env.EMAIL_PASS !== 'replace_me';

  if (isSmtpConfigured) {
    return nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465, // Use SSL for port 465
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  // Development Auto-Provisioning of a real SMTP account
  if (env.NODE_ENV === 'development') {
    if (cachedTransporter) return cachedTransporter;

    try {
      console.log('[SMTP EMAIL] SMTP credentials not set. Auto-provisioning temporary Ethereal SMTP account...');
      testAccount = await nodemailer.createTestAccount();
      console.log(`[SMTP EMAIL] Temporary SMTP Account Created! User: ${testAccount.user}`);
      
      cachedTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      return cachedTransporter;
    } catch (err) {
      console.error('[SMTP EMAIL] Failed to provision temporary Ethereal account, falling back to console:', err);
      return null;
    }
  }

  return null;
};

/**
 * Email Service.
 * Dispatches verification links and password recovery steps.
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  const transporter = await getTransporter();

  if (transporter) {
    try {
      // Determine the sender address (Ethereal requires sending from its own account address)
      const fromAddress = testAccount 
        ? `"Curio Atelier" <${testAccount.user}>` 
        : `"${env.EMAIL_FROM.split('@')[0]}" <${env.EMAIL_FROM}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });

      console.log(`[SMTP EMAIL] Dispatched email successfully to: ${to}`);

      // If using Ethereal, print the real-world web preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('\n========================================================================');
        console.log('[SMTP EMAIL] REAL EMAIL SENT OVER THE INTERNET!');
        console.log(`[SMTP EMAIL] Web Preview URL: ${previewUrl}`);
        
        // Also extract the local action link for easy copy-paste
        const linkMatch = html.match(/href="([^"]+)"/);
        if (linkMatch && linkMatch[1]) {
          console.log(`[SMTP EMAIL] ACTION URL: ${linkMatch[1]}`);
        }
        console.log('========================================================================\n');
      }
    } catch (err) {
      console.error('[SMTP EMAIL ERROR] Failed sending via SMTP, falling back to console:', err);
      logDevEmail(to, subject, html);
    }
  } else {
    logDevEmail(to, subject, html);
  }
};

/**
 * Helper to log dev emails to console without crashing.
 */
const logDevEmail = (to: string, subject: string, html: string) => {
  console.log('\n========================================================================');
  console.log(`[DEV EMAIL] TO: ${to}`);
  console.log(`[DEV EMAIL] SUBJECT: ${subject}`);
  
  // Extract link if one exists in the HTML body for easy copy-paste in development
  const linkMatch = html.match(/href="([^"]+)"/);
  if (linkMatch && linkMatch[1]) {
    console.log(`[DEV EMAIL] ACTION URL: ${linkMatch[1]}`);
  }
  
  console.log('========================================================================\n');
};

export default sendEmail;
