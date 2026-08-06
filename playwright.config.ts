import { defineConfig } from "@playwright/test";
import path from "path";

const PORT = Number(process.env.E2E_PORT || 3000);
// Must be "localhost", not "127.0.0.1": the Next dev server's HMR client binds
// to localhost and fails its websocket handshake over the loopback IP, which
// leaves the page un-hydrated. Every interaction test then passes vacuously
// against dead server-rendered HTML.
const BASE_URL = `http://localhost:${PORT}`;

const ADMIN_STATE = path.join(__dirname, "e2e", ".auth", "admin.json");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Specs that must be unauthenticated (401 guards, public pages)
      name: "anonymous",
      testMatch: /(admin-auth|booking|public-pages)\.spec\.ts/,
    },
    {
      // Specs that need a staff session, reusing the one sign-in from setup
      name: "authenticated",
      testMatch: /(admin-session|admin-pages)\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: ADMIN_STATE },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
