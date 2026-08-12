import { createTransport } from "nodemailer";
import { logFailedVisionEmail } from "./logFailedLead.js";

export const sendEmailToVision = async (to, subject, text) => {
  try {
    const { SMTP_HOST, SMTP_PORT, user, pass } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !user || !pass) {
      console.error("Missing SMTP configuration in environment variables.");
      throw new Error("SMTP configuration error.");
    }

    const transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      service: "gmail",
      auth: {
        user,
        pass,
      },
    });

    transporter.sendMail({
      from: user,
      to,
      subject,
      html: text,
    });

    // console.log(`Email sent successfully to ${to}: ${info.response}`);
    // return info;
  } catch (error) {
    logFailedVisionEmail({
      text,
      error: error?.message,
      timestamp: new Date().toISOString(),
    });
  }
};
