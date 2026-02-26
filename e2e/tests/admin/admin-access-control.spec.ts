import { test, expect } from "@playwright/test";

// Use fresh context without admin cookies
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Admin access control", () => {
  test("should show login form when accessing /admin without session", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page.locator("input#admin-email")).toBeVisible();
    await expect(page.locator("input#admin-password")).toBeVisible();
  });

  test("should return 401 from /api/admin/leads without auth", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/leads");
    expect(res.status()).toBe(401);
  });

  test("should return 401 from all admin GET endpoints without auth", async ({
    request,
  }) => {
    const endpoints = [
      "/api/admin/quotes",
      "/api/admin/consultations",
      "/api/admin/reservations",
    ];
    for (const endpoint of endpoints) {
      const res = await request.get(endpoint);
      expect(res.status()).toBe(401);
    }
  });
});
