import { test, expect } from "@playwright/test";

test.describe("Models page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/models");
  });

  test("should display page heading", async ({ page }) => {
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should display Standard and Deluxe model cards", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Standard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Deluxe", exact: true }),
    ).toBeVisible();
  });

  test("should show specs on each card", async ({ page }) => {
    // Both models show a Length spec
    await expect(page.getByText("Length").first()).toBeVisible();
  });

  test("should link each card to its detail page", async ({ page }) => {
    const standardLink = page.locator('a[href="/models/standard"]');
    await expect(standardLink).toBeVisible();
  });
});
