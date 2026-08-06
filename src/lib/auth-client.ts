import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

/**
 * No baseURL: the auth routes are served by this same app, so the client must
 * talk to whatever origin the page is actually on.
 *
 * Pinning it to NEXT_PUBLIC_APP_URL meant that whenever that value did not
 * exactly match the current host — a preview deployment, apex vs www, a custom
 * domain, or simply a stale localhost value in production — every session
 * lookup went cross-origin, returned nothing, and AdminShell bounced a
 * correctly signed-in admin straight back to the login page.
 */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
