import { test, expect } from "@playwright/test";

test.describe("Quote form", () => {
  test("should show validation errors for empty name and email", async ({
    page,
  }) => {
    await page.goto("/quote");
    await page.getByRole("button", { name: /request.*quote/i }).click();
    await expect(page.locator(".text-red-600").first()).toBeVisible();
  });

  test("should pre-fill model slug from ?model= query param", async ({
    page,
  }) => {
    await page.goto("/quote?model=standard");
    const select = page.locator("select").first();
    await expect(select).toHaveValue("standard");
  });

  test("should display model options in select", async ({ page }) => {
    await page.goto("/quote");
    const selectHtml = await page.locator("select").first().innerHTML();
    expect(selectHtml).toContain("Standard");
    expect(selectHtml).toContain("Deluxe");
  });

  test("should submit successfully with valid data", async ({ page }) => {
    await page.goto("/quote");
    await page.locator("input[placeholder='Your name']").fill("E2E Quote");
    await page
      .locator("input[placeholder='you@email.com']")
      .fill("e2e-quote@test.com");
    await page.getByRole("button", { name: /request.*quote/i }).click();
    await page.waitForURL(/\/thank-you\?type=quote/, { timeout: 10_000 });
    await expect(page.getByText(/quote request submitted/i)).toBeVisible();
  });

  test("should populate optional dropdowns", async ({ page }) => {
    await page.goto("/quote");
    // Check that multiple select elements exist for power, water, timeline, etc.
    const selects = page.locator("select");
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
