/**
 * Re-seeds admin user credentials using Better Auth's password hashing.
 * This ensures the admin account password is stored in the format
 * Better Auth expects (scrypt) rather than the bcrypt format from the old seed.
 *
 * Run: npx tsx scripts/seed-auth.ts
 */
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://hasana:hasana123@localhost:5432/hasana_hotel?schema=public",
  });

  console.log("Re-hashing admin passwords with Better Auth scrypt format...");

  // Hash the admin password using Better Auth's algorithm
  const hashedPassword = await hashPassword("admin123");

  // Update all credential accounts with the new scrypt hash
  const result = await pool.query(
    `UPDATE accounts SET password = $1 WHERE "providerId" = 'credential'`,
    [hashedPassword]
  );
  console.log(`  Updated ${result.rowCount} credential account(s)`);

  // Also ensure admin@lullaby.com exists (the task specifies this email)
  // Check if we need to update user emails
  const adminUser = await pool.query(`SELECT id, email FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1`);
  if (adminUser.rows.length > 0) {
    const admin = adminUser.rows[0];
    if (admin.email !== "admin@lullaby.com") {
      await pool.query(`UPDATE users SET email = $1 WHERE id = $2`, ["admin@lullaby.com", admin.id]);
      console.log(`  Updated admin email: ${admin.email} -> admin@lullaby.com`);
    }
  }

  console.log("\n✅ Auth credentials re-seeded successfully!");
  console.log("   You can now log in with: admin@lullaby.com / admin123");

  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
