import "server-only";
import { sendMail, siteUrl } from "@/lib/email";
import { prisma } from "@/lib/prisma";

/** Tells a tutor the outcome of their application. Returns whether an email went out. */
export async function tutorDecisionEmail(tutorId: string, decision: string, note: string | null) {
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId }, include: { user: { select: { email: true } } } });
  const to = tutor?.user?.email ?? tutor?.email;
  if (!tutor || !to) return false;
  const first = tutor.name.split(" ")[0];
  const login = { label: "Log in to your dashboard", href: `${siteUrl()}/login` };

  if (decision === "APPROVED") {
    return sendMail({
      to,
      subject: "You're approved to tutor with Learning Hub Africa",
      heading: "Welcome aboard!",
      paragraphs: [
        `Hi ${first},`,
        "Good news: your tutor application has been approved. You can now log in at any time with your email and password.",
        "When we match students to you, the request appears on your dashboard. Accept it to confirm the class. Keep your weekly availability up to date so we can find times that suit you.",
        ...(note ? [`Note from our team: ${note}`] : []),
      ],
      button: login,
    });
  }
  if (decision === "REJECTED") {
    return sendMail({
      to,
      subject: "Your Learning Hub Africa tutor application",
      heading: "About your application",
      paragraphs: [
        `Hi ${first},`,
        "Thank you for applying to tutor with us. We're unable to approve your application at this time.",
        ...(note ? [`Note from our team: ${note}`] : []),
        "You can still log in to update your profile, and reply to this email if you have questions.",
      ],
      button: login,
    });
  }
  if (decision === "SUSPENDED") {
    return sendMail({
      to,
      subject: "Your Learning Hub Africa tutor account",
      heading: "Your tutor account is on hold",
      paragraphs: [
        `Hi ${first},`,
        "Your tutor account has been put on hold, so you won't receive new students for now.",
        ...(note ? [`Note from our team: ${note}`] : []),
        "Please contact us if you have questions.",
      ],
    });
  }
  return false;
}
