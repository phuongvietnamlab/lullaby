import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** Staff roles that may reach the admin panel and its APIs. */
const STAFF_ROLES = ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Session for a user carrying a staff role, or null.
 *
 * A valid session alone is NOT enough: the user record must also hold one of
 * STAFF_ROLES. `role` is declared `input: false` in the auth config so it can
 * never be set through sign-up, and public sign-up is disabled — staff accounts
 * are provisioned directly in the database.
 */
export async function requireAdminSession() {
  const session = await getServerSession();
  if (!session) return null;

  const role = (session.user as { role?: string }).role;
  if (!role || !STAFF_ROLES.includes(role as StaffRole)) return null;

  return session;
}

/**
 * Guard for admin API route handlers.
 *
 * Returns a 401 NextResponse to return immediately, or the session when the
 * caller is authorised:
 *
 *   const guard = await requireAdminApi();
 *   if (guard instanceof NextResponse) return guard;
 */
export async function requireAdminApi(allowedRoles?: readonly StaffRole[]) {
  const session = await requireAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (allowedRoles) {
    const role = (session.user as { role?: string }).role as StaffRole;
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return session;
}
