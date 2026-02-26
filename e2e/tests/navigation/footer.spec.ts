import { test, expect } from "@playwright/test";
import { FOOTER_LINKS } from "../../fixtures/test-data";

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/faq"); // Use /faq — static page that renders without DB
  });

  test("should display company name and location", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(
      footer.getByText("Ready Built Containers", { exact: true }),
    ).toBeVisible();
    await expect(footer.getByText("Audubon, Iowa")).toBeVisible();
  });

  test("should display email contact link", async ({ page }) => {
    const emailLink = page
      .locator("footer")
      .getByRole("link", { name: /readybuiltcontainers\.com/i });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute(
      "href",
      "mailto:build@readybuiltcontainers.com",
    );
  });

  test("should contain all Explore links", async ({ page }) => {
    const footer = page.locator("footer");
    for (const item of FOOTER_LINKS) {
      const link = footer.getByRole("link", { name: item.label });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", item.href);
    }
  });

  test("should contain Privacy and Terms links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(
      footer.getByRole("link", { name: "Privacy" }),
    ).toHaveAttribute("href", "/privacy");
    await expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  test("should display current year in copyright", async ({ page }) => {
    const year = new Date().getFullYear().toString();
    await expect(page.locator("footer").getByText(year)).toBeVisible();
  });
});
