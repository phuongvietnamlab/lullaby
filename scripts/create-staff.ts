/**
 * Create or update a staff account.
 *
 * Public sign-up is disabled (see src/lib/auth.ts), so staff accounts are
 * provisioned here rather than through the login page.
 *
 * Run:
 *   npx tsx scripts/create-staff.ts <email> <password> [ROLE]
 *
 * ROLE is SUPER_ADMIN | MANAGER | RECEPTIONIST (default RECEPTIONIST).
 * Re-running with an existing email resets that account's password and role.
 */
import { randomUUID } from "crypto";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

const ROLES = ["SUPER_ADMIN", "MANAGER", "RECEPTIONIST"] as const;
type Role = (typeof ROLES)[number];

async function main() {
  const [email, password, roleArg] = process.argv.slice(2);
  const role = (roleArg || "RECEPTIONIST").toUpperCase() as Role;

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/create-staff.ts <email> <password> [SUPER_ADMIN|MANAGER|RECEPTIONIST]"
    );
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Expected one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes("supabase.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    const hashed = await hashPassword(password);
    const now = new Date();

    const existing = await pool.query(
      `SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1`,
      [email]
    );

    let userId: string;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await pool.query(
        `UPDATE users SET role = $1, "updatedAt" = $2 WHERE id = $3`,
        [role, now, userId]
      );
      console.log(`Updated existing user ${email} -> role ${role}`);
    } else {
      userId = randomUUID();
      await pool.query(
        `INSERT INTO users (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, true, $5, $5)`,
        [userId, email, email.split("@")[0], role, now]
      );
      console.log(`Created user ${email} with role ${role}`);
    }

    const account = await pool.query(
      `SELECT id FROM accounts WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
      [userId]
    );

    if (account.rows.length > 0) {
      await pool.query(
        `UPDATE accounts SET password = $1, "updatedAt" = $2 WHERE id = $3`,
        [hashed, now, account.rows[0].id]
      );
      console.log("  Password reset.");
    } else {
      await pool.query(
        `INSERT INTO accounts (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, $5, $5)`,
        [randomUUID(), userId, userId, hashed, now]
      );
      console.log("  Credential account created.");
    }

    console.log(`\n✅ ${email} can now sign in at /admin/login`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
