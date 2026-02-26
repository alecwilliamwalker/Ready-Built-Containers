import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../../fixtures/test-data";

test.describe("Account designs page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should show sign-in prompt when not authenticated", async ({
    page,
  }) => {
    await page.goto("/account/designs");
    // Unauthenticated page title: "Design Library" with message "Sign in to view your saved layouts"
    await expect(
      page.getByText("Sign in to view your saved layouts"),
    ).toBeVisible();
  });

  test("should show link to design studio", async ({ page }) => {
    await page.goto("/account/designs");
    const link = page.getByRole("link", { name: /design studio/i });
    await expect(link).toBeVisible();
  });

  test("should show design library when authenticated", async ({ page }) => {
    // Register and login
    const email = uniqueEmail("account-designs");
    await page.request.post("/api/auth/register", {
      data: {
        email,
        password: "testpassword123",
        confirmPassword: "testpassword123",
        name: "Design Lib User",
      },
    });

    await page.goto("/account/designs");
    // Authenticated page title: "Manage your custom layouts"
    await expect(
      page.getByText("Manage your custom layouts"),
    ).toBeVisible();
  });
});
