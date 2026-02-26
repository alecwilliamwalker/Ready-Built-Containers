import { test as setup, expect } from "@playwright/test";
import { resolve } from "path";
import { ADMIN_CREDENTIALS } from "./test-data";

const ADMIN_AUTH_FILE = resolve(__dirname, "..", ".auth", "admin.json");

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/admin");

  await page.locator("input#admin-email").fill(ADMIN_CREDENTIALS.email);
  await page.locator("input#admin-password").fill(ADMIN_CREDENTIALS.password);
  await page.locator("button[type='submit']").click();

  // Wait for dashboard to appear (login form disappears)
  await expect(page.locator("input#admin-email")).not.toBeVisible({
    timeout: 15_000,
  });

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
