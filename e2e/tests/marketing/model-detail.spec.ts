import { test, expect } from "@playwright/test";
import { MODELS } from "../../fixtures/test-data";

for (const [key, model] of Object.entries(MODELS)) {
  test.describe(`Model detail: ${model.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/models/${model.slug}`);
    });

    test("should display the model name", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: model.name, exact: true }),
      ).toBeVisible();
    });

    test("should display images", async ({ page }) => {
      const images = page.locator("img");
      await expect(images.first()).toBeVisible();
    });

    test("should display floorplan information", async ({ page }) => {
      await expect(page.getByText(/layout|floorplan/i)).toBeVisible();
    });

    test("should display the embedded QuoteForm", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /request.*quote|quote/i }),
      ).toBeVisible();
    });

    test("should display the embedded ConsultationForm", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: /consultation|schedule/i }),
      ).toBeVisible();
    });

    test("should display the reserve CTA", async ({ page }) => {
      const reserveLink = page.getByRole("link", {
        name: /start reservation/i,
      });
      await expect(reserveLink).toBeVisible();
      await expect(reserveLink).toHaveAttribute(
        "href",
        new RegExp(`/reserve\\?model=${model.slug}`),
      );
    });
  });
}

test("should return 404 for nonexistent model slug", async ({ page }) => {
  const response = await page.goto("/models/nonexistent-model");
  expect(response?.status()).toBe(404);
});
