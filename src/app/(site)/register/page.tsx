import { redirect } from "next/navigation";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Only students sign up on the website; tutor accounts are created by LHA staff.
export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const qs = new URLSearchParams(
    Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string"),
  ).toString();
  redirect(`/register/student${qs ? `?${qs}` : ""}`);
}
