"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-fetches the page's server data every few seconds while something is processing. */
export function AutoRefresh({ seconds = 4 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
