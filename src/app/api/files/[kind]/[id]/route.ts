import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Private file downloads: only the owner and staff can open timetables and tutor credentials.
export async function GET(_: NextRequest, ctx: RouteContext<"/api/files/[kind]/[id]">) {
  const { kind, id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not found", { status: 404 });
  const staff = ["ADMIN", "FINANCE", "SUPPORT"].includes(user.role);

  let file: { fileName: string; mimeType: string; data: Uint8Array } | null = null;
  if (kind === "timetable") {
    file = await prisma.timetableUpload.findFirst({
      where: { id, ...(staff ? {} : { student: { userId: user.id } }) },
      select: { fileName: true, mimeType: true, data: true },
    });
  } else if (kind === "credential") {
    file = await prisma.tutorCredential.findFirst({
      where: { id, ...(user.role === "ADMIN" ? {} : { tutor: { userId: user.id } }) },
      select: { fileName: true, mimeType: true, data: true },
    });
  }
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.fileName.replace(/[^\w.\- ]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
