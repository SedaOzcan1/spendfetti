import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/** Emails sent while NODE_ENV=test (inspected by tests). */
export const sentMails = [];

let transport;

function getTransport() {
  if (!transport && env.SMTP_URL) transport = nodemailer.createTransport(env.SMTP_URL);
  return transport;
}

/** Sends an email via SMTP, or logs it when no SMTP server is configured. */
export async function sendMail({ to, subject, text, html }) {
  const message = { from: env.MAIL_FROM, to, subject, text, html };

  if (env.NODE_ENV === 'test') {
    sentMails.push(message);
    return;
  }
  const smtp = getTransport();
  if (!smtp) {
    console.log(
      `✉️  [mail not sent: SMTP_URL is not set]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`,
    );
    return;
  }
  await smtp.sendMail(message);
}
