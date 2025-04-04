const nodemailer = require("nodemailer");
const { ServerConfig } = require("../config");

async function sendEmail(senderEmail, recipientEmail, subject, text, html) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ServerConfig.GMAIL_ID,
        pass: ServerConfig.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      text: text,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.response}`);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
}

module.exports = { sendEmail };
