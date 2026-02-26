import { test, expect } from "@playwright/test";

test("should return 404 page for unknown routes", async ({ page }) => {
  const response = await page.goto("/nonexistent-page-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/not found/i)).toBeVisible();
});
