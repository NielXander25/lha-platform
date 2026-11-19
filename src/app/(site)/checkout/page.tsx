import { redirect } from "next/navigation";

// Old checkout links now lead to registration, where payment happens after sign-up.
export default async function CheckoutRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { course } = await searchParams;
  redirect(typeof course === "string" ? `/register/student?course=${encodeURIComponent(course)}` : "/register/student");
}
