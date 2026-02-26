import { test as base, type Page, type APIRequestContext } from "@playwright/test";
import { ADMIN_CREDENTIALS } from "./test-data";

type AuthFixtures = {
  adminPage: Page;
  userRequest: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  // Page already authenticated as admin
  adminPage: async ({ page, baseURL }, use) => {
    await page.request.post(`${baseURL}/api/admin/login`, {
      data: ADMIN_CREDENTIALS,
    });
    await page.goto("/admin");
    await use(page);
  },

  // APIRequestContext with user session cookie
  userRequest: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({ baseURL: baseURL! });
    const email = `fixture-${Date.now()}@test.com`;

    const reg = await context.post("/api/auth/register", {
      data: {
        email,
        password: "testpassword123",
        confirmPassword: "testpassword123",
        name: "Fixture User",
      },
    });

    if (!reg.ok()) {
      // Might already exist; try login
      await context.post("/api/auth/login", {
        data: { email, password: "testpassword123" },
      });
    }

    await use(context);
    await context.dispose();
  },
});

export { expect } from "@playwright/test";
