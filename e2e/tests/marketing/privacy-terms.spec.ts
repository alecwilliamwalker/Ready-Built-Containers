import { test, expect } from "@playwright/test";

test("should render the privacy policy page", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("should render the terms page", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading").first()).toBeVisible();
});
