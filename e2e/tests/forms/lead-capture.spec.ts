import { test, expect } from "@playwright/test";

test.describe("Lead capture form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Scroll to the lead capture form section
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: /pricing|availability/i }),
    });
    await form.scrollIntoViewIfNeeded();
    // Disable browser native validation so react-hook-form validation runs
    await form.evaluate((el) => el.setAttribute("novalidate", ""));
  });

  test("should show validation errors when submitting empty form", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /pricing|availability/i })
      .click();
    await expect(page.locator(".text-red-600").first()).toBeVisible();
  });

  test("should show email validation error for invalid email", async ({
    page,
  }) => {
    await page.locator("#lead-name").fill("Test User");
    await page.locator("#lead-email").fill("not-email");
    await page
      .getByRole("button", { name: /pricing|availability/i })
      .click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("should show name validation error for single character", async ({
    page,
  }) => {
    await page.locator("#lead-name").fill("A");
    await page.locator("#lead-email").fill("test@test.com");
    await page
      .getByRole("button", { name: /pricing|availability/i })
      .click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("should submit successfully and redirect to thank-you", async ({
    page,
  }) => {
    await page.locator("#lead-name").fill("E2E Lead Test");
    await page.locator("#lead-email").fill("e2e-lead@test.com");
    await page
      .getByRole("button", { name: /pricing|availability/i })
      .click();
    await page.waitForURL(/\/thank-you\?type=lead/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/thank-you\?type=lead/);
  });

  test("should display thank-you page content after redirect", async ({
    page,
  }) => {
    await page.locator("#lead-name").fill("E2E Thank You");
    await page.locator("#lead-email").fill("e2e-thankyou@test.com");
    await page
      .getByRole("button", { name: /pricing|availability/i })
      .click();
    await page.waitForURL(/\/thank-you/, { timeout: 10_000 });
    // Thank-you page title for type=lead: "We received your request"
    await expect(page.getByText(/we received your request/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /back to home/i }),
    ).toBeVisible();
  });
});
