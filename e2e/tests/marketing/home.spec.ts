import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should render the Hero section", async ({ page }) => {
    // Hero h1: "Container cabins built to disappear into the timber."
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/container/i);
  });

  test("should render model cards", async ({ page }) => {
    // Scope to the #models section to avoid matching hero/nav text
    const modelsSection = page.locator("#models");
    await expect(modelsSection.getByText("Standard").first()).toBeVisible();
    await expect(modelsSection.getByText("Deluxe").first()).toBeVisible();
  });

  test("should link to /models from models section", async ({ page }) => {
    const link = page.getByRole("link", { name: /explore.*model/i });
    await expect(link).toBeVisible();
  });

  test("should render the process timeline section", async ({ page }) => {
    // Title: "From idea to hunt-ready cabin in 90 days"
    await expect(
      page.getByRole("heading", { name: /from idea.*hunt-ready/i }),
    ).toBeVisible();
  });

  test("should render the lead capture form", async ({ page }) => {
    // The lead form should have a submit button
    await expect(
      page.getByRole("button", { name: /pricing|availability/i }),
    ).toBeVisible();
  });

  test("should render FAQ preview items", async ({ page }) => {
    // FAQ question: "How much does a 40' container cabin cost?"
    await expect(page.getByText(/how much.*cabin/i)).toBeVisible();
  });

  test("should link to full FAQ page", async ({ page }) => {
    const faqLink = page.getByRole("link", { name: /view.*faq|all.*faq/i });
    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveAttribute("href", /\/faq/);
  });

  test("should render lead form with correct fields", async ({ page }) => {
    const form = page.locator("form").filter({
      has: page.getByRole("button", { name: /pricing|availability/i }),
    });
    await expect(form.locator("input[type='text'], input[type='email'], input[placeholder]").first()).toBeVisible();
  });
});
