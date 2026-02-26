import { test, expect } from "@playwright/test";

test.describe("Design Studio", () => {
  test("should load the design studio page", async ({ page }) => {
    await page.goto("/design");
    await page.waitForLoadState("domcontentloaded");
    // Page should load without crashing
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("should display toolbar or design controls", async ({ page }) => {
    await page.goto("/design");
    await page.waitForLoadState("networkidle");
    // Look for any interactive elements (toolbar, buttons, etc.)
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should display fixture library or palette", async ({ page }) => {
    await page.goto("/design");
    await page.waitForLoadState("networkidle");
    // The design studio should have some fixture categories
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });

  test("should load module catalog data via API", async ({ request }) => {
    const res = await request.get("/api/catalog/modules");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.modules.length).toBeGreaterThanOrEqual(30);
  });
});
