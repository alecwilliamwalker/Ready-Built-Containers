import { test, expect } from "@playwright/test";
import { AdminPage } from "../../page-objects/AdminPage";
import { ADMIN_CREDENTIALS } from "../../fixtures/test-data";

// These tests use a fresh browser context (no stored auth state)
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Admin authentication", () => {
  let admin: AdminPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminPage(page);
    await admin.goto();
  });

  test("should display login form when not authenticated", async () => {
    await expect(admin.emailInput).toBeVisible();
    await expect(admin.passwordInput).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await admin.login(ADMIN_CREDENTIALS.email, "wrongpassword");
    // Wait for the error toast/message
    await expect(
      page.getByText("Login failed"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show validation errors for empty fields", async () => {
    await admin.loginButton.click();
    await expect(admin.errorMessages().first()).toBeVisible();
  });

  test("should login successfully with valid credentials", async ({
    page,
  }) => {
    // Submit the login form and wait for the API response
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/admin/login") && resp.status() === 200,
    );
    await admin.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await responsePromise;

    // router.refresh() re-fetches the server component which runs many DB queries;
    // if it hasn't completed after a few seconds, force a full reload
    try {
      await expect(admin.emailInput).not.toBeVisible({ timeout: 8_000 });
    } catch {
      await page.reload({ waitUntil: "networkidle" });
    }

    await expect(admin.emailInput).not.toBeVisible({ timeout: 15_000 });
    // Should see admin content (table or tab navigation)
    await expect(
      page.getByRole("link", { name: /leads/i }),
    ).toBeVisible();
  });

  test("should display admin email on dashboard after login", async ({
    page,
  }) => {
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/admin/login") && resp.status() === 200,
    );
    await admin.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await responsePromise;

    try {
      await expect(admin.emailInput).not.toBeVisible({ timeout: 8_000 });
    } catch {
      await page.reload({ waitUntil: "networkidle" });
    }

    await expect(admin.emailInput).not.toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(ADMIN_CREDENTIALS.email),
    ).toBeVisible();
  });

  test("should logout and return to login form", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/admin/login") && resp.status() === 200,
    );
    await admin.login(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password);
    await responsePromise;

    try {
      await expect(admin.emailInput).not.toBeVisible({ timeout: 8_000 });
    } catch {
      await page.reload({ waitUntil: "networkidle" });
    }

    await expect(admin.emailInput).not.toBeVisible({ timeout: 15_000 });

    await admin.logoutButton.click();
    await expect(admin.emailInput).toBeVisible({ timeout: 10_000 });
  });
});
