import { test, expect } from "@playwright/test";

test.describe("Plans page", () => {
  test("should render the plans page", async ({ page }) => {
    await page.goto("/plans");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should display plan content", async ({ page }) => {
    await page.goto("/plans");
    // Page should display model comparison data (table or gallery)
    // Only hc20 and hc40 should be shown (Standard model removed)
    await expect(
      page.getByText(/high cube/i).first(),
    ).toBeVisible();
  });
});
