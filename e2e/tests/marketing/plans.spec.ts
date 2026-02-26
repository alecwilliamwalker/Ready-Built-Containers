import { test, expect } from "@playwright/test";

test.describe("Plans page", () => {
  test("should render the plans page", async ({ page }) => {
    await page.goto("/plans");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should display plan content", async ({ page }) => {
    await page.goto("/plans");
    // Page should display model comparison data (table or gallery)
    await expect(
      page.getByText(/standard|deluxe/i).first(),
    ).toBeVisible();
  });
});
