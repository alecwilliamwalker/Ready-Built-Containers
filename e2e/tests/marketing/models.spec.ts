import { test, expect } from "@playwright/test";

test.describe("Models page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/models");
  });

  test("should display page heading", async ({ page }) => {
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should display High Cube model cards", async ({ page }) => {
    // Only hc20 and hc40 should be shown (Standard model removed)
    await expect(
      page.getByRole("heading", { name: "20' High Cube", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "40' High Cube", exact: true }),
    ).toBeVisible();
  });

  test("should show specs on each card", async ({ page }) => {
    // Both models show a Length spec
    await expect(page.getByText("Length").first()).toBeVisible();
  });

  test("should link each card to its detail page", async ({ page }) => {
    const hc20Link = page.locator('a[href="/models/hc20"]');
    await expect(hc20Link).toBeVisible();
    const hc40Link = page.locator('a[href="/models/hc40"]');
    await expect(hc40Link).toBeVisible();
  });
});
