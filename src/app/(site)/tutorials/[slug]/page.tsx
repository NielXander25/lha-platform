import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, CalendarDays, Check, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SITE, whatsappLink } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

async function getCourse(slug: string) {
  return prisma.course.findFirst({
    where: { slug, active: true },
    include: {
      assignments: {
        where: { tutor: { active: true }, location: { active: true } },
        include: { tutor: true, location: true },
        orderBy: [{ location: { kind: "desc" } }, { location: { name: "asc" } }],
      },
    },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const course = await getCourse((await params).slug);
  return course
    ? { title: course.code ? `${course.code}: ${course.title}` : course.title, description: course.summary }
    : {};
}

export default async function CoursePage({ params }: { params: Params }) {
  await connection();
  const course = await getCourse((await params).slug);
  if (!course) notFound();

  const included = [
    `${course.sessionsPerWeek} sessions per week, ${course.sessionLengthMins} minutes each`,
    "Taught by a vetted tutor who knows the course well",
    "Simplified notes and worked examples",
    "Past-question practice before tests and exams",
  ];
  const places = new Set(course.assignments.map((a) => a.location.id)).size;
  const name = course.code ? `${course.code} (${course.title})` : course.title;
  const enquiry = `Hello Learning Hub Africa, I'm interested in the ${name} tutorial.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/tutorials" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> All tutorials
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">{course.category}</span>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{course.level}</span>
          </div>
          {course.code && <p className="mt-4 text-lg font-bold tracking-wide text-sun-600">{course.code}</p>}
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-brand-950">{course.title}</h1>
          <p className="mt-4 text-lg text-stone-600">{course.summary}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Fact icon={CalendarDays} label="Frequency" value={`${course.sessionsPerWeek}× per week`} />
            <Fact icon={Clock} label="Session length" value={`${course.sessionLengthMins} minutes`} />
            <Fact icon={MapPin} label="Where" value={places ? `${places} location${places === 1 ? "" : "s"}` : "Coming soon"} />
          </div>

          <h2 className="mt-10 text-lg font-semibold text-stone-900">About this tutorial</h2>
          <p className="mt-3 leading-relaxed text-stone-600">{course.description}</p>

          <h2 className="mt-10 text-lg font-semibold text-stone-900">Tutors & locations</h2>
          {course.assignments.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
              Tutors and locations for this tutorial will be announced soon. Contact us for details.
            </p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {course.assignments.map((a) => (
                <li key={a.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-800">
                      {a.tutor.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <p className="font-semibold text-stone-900">{a.tutor.name}</p>
                      <p className="text-xs text-stone-500">{a.tutor.subjects}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-stone-600">
                    <p className="flex gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      <span>
                        <span className="font-medium text-stone-800">{a.location.name}</span>
                        <span className="text-stone-500"> · {a.location.kind}, {SITE.schoolShort}</span>
                      </span>
                    </p>
                    {a.schedule && (
                      <p className="flex gap-2">
                        <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" /> {a.schedule}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 text-lg font-semibold text-stone-900">What&apos;s included</h2>
          <ul className="mt-4 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-stone-700">
                <Check className="mt-0.5 size-5 shrink-0 rounded-full bg-brand-100 p-0.5 text-brand-700" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5">
            <p className="text-sm font-medium text-stone-500">Price</p>
            <p className="mt-1">
              <span className="font-display text-4xl font-semibold text-stone-900">{formatPrice(course.price)}</span>
              <span className="text-stone-500"> / {course.billingUnit}</span>
            </p>
            <hr className="my-6 border-stone-100" />
            <h2 className="font-semibold text-stone-900">Interested in this tutorial?</h2>
            <p className="mt-1 text-sm text-stone-500">Reach out and we&apos;ll answer your questions and help you get started.</p>
            <div className="mt-5 space-y-3">
              <a
                href={whatsappLink(enquiry)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
              >
                <MessageCircle className="size-5" /> Chat on WhatsApp
              </a>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <Phone className="size-4" /> {SITE.phone}
              </a>
              <a
                href={`mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry: ${name}`)}`}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-6 py-3 font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <Mail className="size-4" /> Email us
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <Icon className="size-5 text-brand-600" />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-0.5 font-semibold text-stone-900">{value}</p>
    </div>
  );
}
