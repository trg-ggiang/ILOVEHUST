import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass || !mailFrom) return null;

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = getTransporter();
  const subject = "ILoveHust - Dat lai mat khau";
  const text = [
    "Ban vua yeu cau dat lai mat khau ILoveHust.",
    "Mo lien ket sau de tao mat khau moi:",
    resetUrl,
    "Lien ket co hieu luc trong 30 phut. Neu ban khong yeu cau, hay bo qua email nay.",
  ].join("\n\n");

  if (!transporter) {
    console.warn("PASSWORD RESET EMAIL NOT SENT: missing SMTP config", { to, resetUrl });
    return { sent: false };
  }

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html: `
      <p>Ban vua yeu cau dat lai mat khau ILoveHust.</p>
      <p><a href="${resetUrl}">Dat lai mat khau</a></p>
      <p>Lien ket co hieu luc trong 30 phut. Neu ban khong yeu cau, hay bo qua email nay.</p>
    `,
  });

  return { sent: true };
}
