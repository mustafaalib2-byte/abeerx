import { NextRequest } from "next/server";

/**
 * Shared guard for the admin-only R2 endpoints (upload / delete / sync /
 * auto-link / update-images / list). These routes can overwrite or delete
 * store data, so every one of them must call this before touching R2.
 *
 * The caller (admin.html) sends the key in the `x-admin-key` header.
 * Set ADMIN_API_KEY in your environment (.env.local for local dev, and in
 * your Vercel project's Environment Variables for production) — do NOT
 * prefix it with NEXT_PUBLIC_, it must stay server-only.
 *
 * NOTE: because admin.html is a static file, this key is visible to anyone
 * who views its page source. It stops opportunistic/automated abuse of
 * these endpoints, but it is not a substitute for real per-user auth. The
 * stronger fix is to verify the logged-in admin/staff member's Firebase ID
 * token server-side (via firebase-admin) instead of a shared secret.
 */
export function isAuthorizedAdminRequest(req: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    // Fail closed: if the key isn't configured, refuse rather than allow.
    console.error("ADMIN_API_KEY is not set — refusing admin R2 request.");
    return false;
  }
  const provided = req.headers.get("x-admin-key");
  return provided === expected;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-key",
};
