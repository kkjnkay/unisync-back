const nodemailer = require('nodemailer');

async function sendEmail({ smtpHost, smtpPort, smtpUser, smtpPass, to, subject, htmlBody }) {
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: smtpUser,
    to,
    subject,
    html: htmlBody, // Відправляємо HTML замість звичайного тексту
  });
}

module.exports = sendEmail;