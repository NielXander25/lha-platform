import { headers } from "next/headers";

// Simple shared-password protection for the admin area until real staff
// accounts are added. The browser prompts for it (HTTP Basic auth).

export function isValidAdminAuth(authorization: string | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !authorization?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authorization.slice(6));
    const supplied = decoded.slice(decoded.indexOf(":") + 1);
    return supplied === password;
  } catch {
    return false;
  }
}

// Call at the top of every admin Server Action: actions can be invoked by a
// direct POST, so the proxy check alone is not enough.
export async function requireAdmin() {
  const h = await headers();
  if (!isValidAdminAuth(h.get("authorization"))) {
    throw new Error("Unauthorized");
  }
}
