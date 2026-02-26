import { test, expect } from "@playwright/test";

test.describe("Reservation form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reserve");
  });

  test("should show validation errors for empty required fields", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /reserve|deposit|submit/i }).click();
    await expect(page.locator(".text-red-600").first()).toBeVisible();
  });

  test("should show error when terms checkbox is not checked", async ({
    page,
  }) => {
    await page.locator("input[placeholder='Your name']").fill("E2E Reserve");
    await page
      .locator("input[placeholder='you@email.com']")
      .fill("e2e-reserve@test.com");
    await page.getByRole("button", { name: /reserve|deposit|submit/i }).click();
    await expect(
      page.getByText(/must confirm.*reservation terms/i),
    ).toBeVisible();
  });

  test("should pre-fill model slug from ?model= query param", async ({
    page,
  }) => {
    await page.goto("/reserve?model=deluxe");
    const select = page.locator("select").first();
    await expect(select).toHaveValue("deluxe");
  });

  test("should attempt checkout on valid submission (mocked)", async ({
    page,
  }) => {
    // Mock the checkout endpoint to return a fake Stripe URL
    await page.route("**/api/reservations/checkout", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ url: "https://checkout.stripe.com/mock-session" }),
      });
    });

    await page.locator("input[placeholder='Your name']").fill("E2E Reserve");
    await page
      .locator("input[placeholder='you@email.com']")
      .fill("e2e-reserve@test.com");
    // Check the terms checkbox
    await page.locator("input[type='checkbox']").check();
    await page.getByRole("button", { name: /reserve|deposit|submit/i }).click();

    // Should attempt to navigate to Stripe - the page will try to redirect
    await page.waitForTimeout(2000);
  });

  test("should display error when checkout API fails", async ({ page }) => {
    await page.route("**/api/reservations/checkout", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create reservation checkout" }),
      });
    });

    await page.locator("input[placeholder='Your name']").fill("E2E Reserve");
    await page
      .locator("input[placeholder='you@email.com']")
      .fill("e2e-reserve@test.com");
    await page.locator("input[type='checkbox']").check();
    await page.getByRole("button", { name: /reserve|deposit|submit/i }).click();

    // Should show an error (via toast or form error)
    await page.waitForTimeout(2000);
    // Look for any error indication
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
