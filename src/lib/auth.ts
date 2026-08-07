import { betterAuth } from "better-auth";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const globalForAuthPool = globalThis as unknown as {
  authPool: Pool | undefined;
};

// One pool per process, like src/lib/db.ts. Without this, HMR in dev and every
// warm serverless invocation opened a fresh pool. Combined with the Prisma pool
// that was enough to blow past Supabase's connection cap
// ("EMAXCONNSESSION: max clients reached").
function createAuthPool() {
  return new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: connectionString?.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

const pool = globalForAuthPool.authPool ?? createAuthPool();
globalForAuthPool.authPool = pool;

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
    "https://lullaby-xi.vercel.app",
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // Staff accounts are provisioned directly in the DB (see scripts/). Leaving
    // sign-up open would let anyone self-register and reach the admin panel.
    disableSignUp: true,
  },
  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "RECEPTIONIST",
        required: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verifications",
  },
});

export type Session = typeof auth.$Infer.Session;
