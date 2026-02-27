import { test, expect } from "@playwright/test";

test.describe("Consultation form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/consultation");
  });

  test("should show validation errors for empty name and email", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /consultation|schedule|submit/i })
      .click();
    await expect(page.locator(".text-red-600").first()).toBeVisible();
  });

  test("should submit successfully with name and email", async ({ page }) => {
    await page.locator("input[placeholder='Your name']").fill("E2E Consult");
    await page
      .locator("input[placeholder='you@email.com']")
      .fill("e2e-consult@test.com");
    await page
      .getByRole("button", { name: /consultation|schedule|submit/i })
      .click();
    await page.waitForURL(/\/thank-you\?type=consult/, { timeout: 10_000 });
    await expect(page.getByText(/consultation scheduled/i)).toBeVisible();
  });

  test("should display model options in preferred model select", async ({
    page,
  }) => {
    const selectHtml = await page.locator("select").first().innerHTML();
    // Only hc20 and hc40 should be listed (Standard model removed)
    expect(selectHtml).toContain("High Cube");
    // Verify both models are present via their option values
    expect(selectHtml).toContain("hc20");
    expect(selectHtml).toContain("hc40");
  });

  test("should accept a preferred date input", async ({ page }) => {
    const dateInput = page.locator("input[type='date']");
    if ((await dateInput.count()) > 0) {
      await dateInput.fill("2026-06-15");
      await expect(dateInput).toHaveValue("2026-06-15");
    }
  });
});
