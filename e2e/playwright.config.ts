import { defineConfig, devices } from "@playwright/test";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

const AUTH_FILE = resolve(__dirname, ".auth", "admin.json");
const ROOT = resolve(__dirname, "..");

// Load .env from the project root (or parent repo root for worktrees)
function loadEnvFile(): Record<string, string> {
  const envVars: Record<string, string> = {};
  const candidates = [
    resolve(ROOT, ".env"),
    resolve(ROOT, "..", "..", ".env"), // worktree parent
  ];
  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=\s*"?([^"]*)"?\s*(#.*)?$/);
        if (match) {
          envVars[match[1].trim()] = match[2];
        }
      }
      break;
    }
  }
  return envVars;
}

const envVars = loadEnvFile();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "on-failure" }]],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  globalSetup: "./global-setup.ts",
  globalTeardown: "./global-teardown.ts",

  projects: [
    // Auth setup project (runs first)
    {
      name: "auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Desktop browser tests
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
      dependencies: ["auth-setup"],
      testIgnore: "**/api/**",
    },

    // Mobile viewport tests (subset of specs)
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["auth-setup"],
      testMatch: [
        "**/navigation/**",
        "**/marketing/home.spec.ts",
        "**/forms/**",
      ],
    },

    // API-only tests (no browser needed, fast)
    {
      name: "api",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/api/**",
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...envVars,
      ADMIN_JWT_SECRET:
        envVars.ADMIN_JWT_SECRET ||
        "test-admin-secret-at-least-32-characters-long",
      USER_JWT_SECRET:
        envVars.USER_JWT_SECRET ||
        "test-user-secret-at-least-32-characters-long!!",
    },
  },
});
