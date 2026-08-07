import path from "node:path";
import process from "node:process";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env automatically, and the CLI needs the datasource
// URL declared here. Next.js loads .env itself, so this only affects CLI runs.
try {
  process.loadEnvFile(path.join(__dirname, ".env"));
} catch {
  // No .env file (CI / Vercel) - fall back to the ambient environment
}

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    // DIRECT_URL is the session-mode connection. The transaction pooler that
    // DATABASE_URL points at cannot run migrations (no advisory locks).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
