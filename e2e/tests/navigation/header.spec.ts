import { test, expect } from "@playwright/test";
import { HeaderNav } from "../../page-objects/HeaderNav";
import { NAV_ITEMS } from "../../fixtures/test-data";

test.describe("Header navigation - Desktop", () => {
  let header: HeaderNav;

  test.beforeEach(async ({ page, viewport }) => {
    // Skip desktop tests when running in mobile viewport projects
    test.skip((viewport?.width ?? 1280) < 768, "Desktop-only tests");
    header = new HeaderNav(page);
    await page.goto("/faq"); // Use /faq — static page that renders without DB
  });

  test("should display logo linking to /", async () => {
    await expect(header.logo).toBeVisible();
    await expect(header.logo).toHaveAttribute("href", "/");
  });

  test("should show all desktop nav links", async () => {
    for (const item of NAV_ITEMS) {
      const link = header.desktopLink(item.label);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", item.href);
    }
  });

  test("should show CTA button on desktop", async () => {
    await expect(header.ctaButton).toBeVisible();
  });

  test("should not show mobile menu toggle on desktop", async () => {
    await expect(header.mobileMenuToggle).not.toBeVisible();
  });

  test("should navigate to /process when Process link clicked", async ({
    page,
  }) => {
    const nav = new HeaderNav(page);
    await nav.desktopLink("Process").click();
    await expect(page).toHaveURL(/\/process/);
  });
});

test.describe("Header navigation - Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  let header: HeaderNav;

  test.beforeEach(async ({ page }) => {
    header = new HeaderNav(page);
    await page.goto("/faq"); // Use /faq — static page that renders without DB
  });

  test("should hide desktop nav on mobile", async () => {
    await expect(header.desktopNav).not.toBeVisible();
  });

  test("should show mobile menu toggle", async () => {
    await expect(header.mobileMenuToggle).toBeVisible();
  });

  test("should open mobile menu on toggle click", async () => {
    await header.mobileMenuToggle.click();
    await expect(header.mobileLink("FAQ")).toBeVisible();
  });

  test("should close mobile menu when a link is clicked", async ({ page }) => {
    await header.mobileMenuToggle.click();
    await header.mobileLink("Process").click();
    await expect(page).toHaveURL(/\/process/);
  });

  test("should close mobile menu when toggle clicked again", async () => {
    await header.mobileMenuToggle.click();
    await expect(header.mobileLink("FAQ")).toBeVisible();
    await header.mobileMenuToggle.click();
    // Menu should collapse
    await expect(header.mobileMenu).toHaveClass(/max-h-0/);
  });
});
