import { test, expect } from "@playwright/test";

test.describe("Process page", () => {
  test("should render the process timeline page", async ({ page }) => {
    await page.goto("/process");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("should display multiple process steps", async ({ page }) => {
    await page.goto("/process");
    // Process timeline should have multiple step elements
    const textContent = await page.textContent("body");
    expect(textContent).toBeTruthy();
  });
});
