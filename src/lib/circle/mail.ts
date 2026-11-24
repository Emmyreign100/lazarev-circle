import nodemailer from "nodemailer";
import { ADMIN_EMAIL } from "@/lib/circle/content";

/** Password-reset mail leaves from the staff Gmail. Sending needs GMAIL_APP_PASSWORD. */
export async function sendResetLink(to: string, url: string) {
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!pass) {
    throw new Error(
      "Reset mail is set to sergeylazarev010@gmail.com, but Gmail has not been given a sending password yet.",
    );
  }
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: ADMIN_EMAIL, pass },
  });
  await transport.sendMail({
    from: `Lazarev Circle <${ADMIN_EMAIL}>`,
    to,
    subject: "Reset your Lazarev Circle password",
    text: `Use this link to choose a new password:\n\n${url}\n\nIf you did not ask for this, ignore this email.`,
  });
}
