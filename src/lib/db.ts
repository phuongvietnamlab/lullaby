import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  const pool = new pg.Pool({
    connectionString,
    // Keep this small. Supabase's SESSION-mode pooler caps total clients (e.g.
    // pool_size: 15) and every server instance / serverless lambda opens its own
    // pool, so a large max exhausts the DB ("EMAXCONNSESSION: max clients
    // reached"). For production prefer the Supabase TRANSACTION pooler
    // (host ...pooler.supabase.com:6543, add ?pgbouncer=true) which multiplexes.
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
    ssl: connectionString?.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client per process in EVERY environment. In dev this stops HMR from
// opening a fresh pool on each reload; on a warm serverless instance it stops a
// new pool per invocation — both of which otherwise exhaust the Supabase pooler.
globalForPrisma.prisma = db;
