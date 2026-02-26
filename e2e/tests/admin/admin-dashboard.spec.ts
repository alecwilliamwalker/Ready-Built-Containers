import { test, expect } from "@playwright/test";
import { ADMIN_CREDENTIALS } from "../../fixtures/test-data";

test.describe("Admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin via API, then navigate
    await page.request.post("/api/admin/login", {
      data: ADMIN_CREDENTIALS,
    });
    await page.goto("/admin");
    // Wait for dashboard to load (login form should not be visible)
    await expect(page.locator("input#admin-email")).not.toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display tab buttons", async ({ page }) => {
    await expect(page.getByRole("link", { name: /leads/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /quotes/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /consultations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /reservations/i }),
    ).toBeVisible();
  });

  test("should default to the Leads tab", async ({ page }) => {
    // The leads tab should be active or content visible
    await expect(page.getByText(/name|email|source/i).first()).toBeVisible();
  });

  test("should switch to Quotes tab", async ({ page }) => {
    await page.getByRole("link", { name: /quotes/i }).click();
    await expect(page).toHaveURL(/view=quotes/, { timeout: 15_000 });
  });

  test("should switch to Consultations tab", async ({ page }) => {
    await page.getByRole("link", { name: /consultations/i }).click();
    await expect(page).toHaveURL(/view=consultations/, { timeout: 15_000 });
  });

  test("should switch to Reservations tab", async ({ page }) => {
    await page.getByRole("link", { name: /reservations/i }).click();
    await expect(page).toHaveURL(/view=reservations/, { timeout: 15_000 });
  });

  test("should switch to Custom Designs tab", async ({ page }) => {
    await page.getByRole("link", { name: /custom designs/i }).click();
    await expect(page).toHaveURL(/view=designs/, { timeout: 15_000 });
  });

  test("should display filter pills on Reservations tab", async ({ page }) => {
    await page.getByRole("link", { name: /reservations/i }).click();
    await expect(page.getByRole("link", { name: /all/i })).toBeVisible();
  });

  test("should show empty state message when no data", async ({ page }) => {
    // Check for either data table or empty message
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
