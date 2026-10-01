const nodemailer = require('nodemailer');
const { emailConfigured, isProd } = require('../config/env');

let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  return transporter;
};

/**
 * Sends an email. When email is not configured and we are NOT in production,
 * the message is printed to the console instead (dev mode) and `{ devMode: true }` is returned.
 */
const sendEmail = async (to, subject, text) => {
  if (!emailConfigured()) {
    if (isProd) throw new Error('Email service is not configured');
    console.log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);
    return { devMode: true };
  }
  await getTransporter().sendMail({
    from: `"Secure Justice" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
  return { devMode: false };
};

module.exports = sendEmail;
