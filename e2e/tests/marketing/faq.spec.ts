import { test, expect } from "@playwright/test";

test.describe("FAQ page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/faq");
  });

  test("should render 8 FAQ items", async ({ page }) => {
    // Each FAQ has a clickable question button
    const buttons = page
      .locator("button")
      .filter({ hasText: "?" });
    await expect(buttons).toHaveCount(8);
  });

  test("should have the first item content visible by default", async ({
    page,
  }) => {
    // The first FAQ answer should be visible (activeIndex = 0)
    await expect(page.getByText(/\$51k delivered/i)).toBeVisible();
  });

  test("should collapse the first item when clicked", async ({ page }) => {
    const firstQuestion = page
      .locator("button")
      .filter({ hasText: "How much does a cabin really cost?" });
    await firstQuestion.click();
    await expect(page.getByText(/\$51k delivered/i)).not.toBeVisible();
  });

  test("should expand another item when clicked", async ({ page }) => {
    const thirdQuestion = page
      .locator("button")
      .filter({ hasText: "How do you manage insulation" });
    await thirdQuestion.click();
    await expect(page.getByText(/closed-cell foam/i)).toBeVisible();
  });

  test("should collapse previous item when a new one is opened", async ({
    page,
  }) => {
    // Click third item
    const thirdQuestion = page
      .locator("button")
      .filter({ hasText: "How do you manage insulation" });
    await thirdQuestion.click();
    // First item's answer should no longer be visible
    await expect(page.getByText(/\$51k delivered/i)).not.toBeVisible();
    // Third item's answer should be visible
    await expect(page.getByText(/closed-cell foam/i)).toBeVisible();
  });

  test("should display correct question text", async ({ page }) => {
    await expect(
      page.getByText("How much does a cabin really cost?"),
    ).toBeVisible();
    await expect(
      page.getByText("Do I handle permits or do you?"),
    ).toBeVisible();
    await expect(
      page.getByText("What maintenance should I expect?"),
    ).toBeVisible();
  });
});
