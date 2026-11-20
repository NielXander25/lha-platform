import "server-only";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

/*
 * Outgoing email over SMTP. Works with a Gmail account and an app password out of the box
 * (SMTP_USER + SMTP_PASS); SMTP_HOST / SMTP_PORT switch to any other provider.
 */

export function emailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: nodemailer.Transporter | null = null;
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transport;
}

/** The public address of the site, for links in emails. */
export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Mail = { to: string; subject: string; heading: string; paragraphs: string[]; code?: string; button?: { label: string; href: string } };

function render({ heading, paragraphs, code, button }: Mail) {
  const text = [heading, "", ...paragraphs, ...(code ? ["", `Your code: ${code}`] : []), ...(button ? ["", `${button.label}: ${button.href}`] : []), "", `— ${SITE.name}`].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#18205f;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">${escape(SITE.name)}</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#18205f">${escape(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${escape(p)}</p>`).join("")}
${code ? `<p style="margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;color:#18205f">${code}</p>` : ""}
${button ? `<p style="margin:20px 0;text-align:center"><a href="${escape(button.href)}" style="display:inline-block;background:#2b3aae;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px">${escape(button.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b">${escape(SITE.tagline)}</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

/** Sends an email. Returns false (and logs) instead of throwing, so a mail outage never breaks a page. */
export async function sendMail(mail: Mail) {
  if (!emailConfigured()) {
    console.warn("Email not configured; skipped", { subject: mail.subject });
    return false;
  }
  try {
    const from = process.env.MAIL_FROM || `"${SITE.name}" <${process.env.SMTP_USER}>`;
    await getTransport().sendMail({ from, to: mail.to, subject: mail.subject, ...render(mail) });
    return true;
  } catch (e) {
    console.error("Email failed to send", { subject: mail.subject, error: e instanceof Error ? e.message : String(e) });
    return false;
  }
}
