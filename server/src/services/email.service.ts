/**
 * Email Service.
 * In production, this integrates with Nodemailer, SendGrid, or AWS SES to send emails.
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  // TODO: Implement email sending logic
  console.log(`[Email Service] Sending email to ${to} with subject: "${subject}"`);
};
export default sendEmail;
