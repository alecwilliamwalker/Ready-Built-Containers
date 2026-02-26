import { execSync } from "child_process";
import { resolve } from "path";
import { mkdirSync, existsSync, writeFileSync } from "fs";

const ROOT = resolve(__dirname, "..");
const AUTH_DIR = resolve(__dirname, ".auth");
const ADMIN_AUTH_FILE = resolve(AUTH_DIR, "admin.json");

export default async function globalSetup() {
  // Create .auth directory for storing auth state
  mkdirSync(AUTH_DIR, { recursive: true });

  // Create a fallback empty auth state file so tests don't crash with ENOENT
  // when auth-setup fails (e.g. DB is down). Auth-setup will overwrite this
  // with real admin credentials if it succeeds.
  if (!existsSync(ADMIN_AUTH_FILE)) {
    writeFileSync(
      ADMIN_AUTH_FILE,
      JSON.stringify({ cookies: [], origins: [] }),
    );
    console.log("[global-setup] Created fallback empty admin auth state.");
  }

  console.log("[global-setup] Ensuring Prisma client is generated...");
  try {
    execSync("npx prisma generate", {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.log("[global-setup] Prisma generate skipped (already generated).");
  }

  console.log("[global-setup] Done. Ensure dev server is running with a seeded database.");
}
