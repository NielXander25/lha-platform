import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-navy-deep)] px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <Link href="/" className="font-display text-lg font-semibold text-[var(--color-navy)]">
          Founders <span className="text-[var(--color-gold)]">×</span> LHA
        </Link>
        <h1 className="mt-4 text-xl font-semibold text-[var(--color-ink)]">Welcome back</h1>
        <p className="mt-1 text-sm text-[var(--color-ink)]/60">
          Log in to your Leadership Development Programme dashboard.
        </p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
