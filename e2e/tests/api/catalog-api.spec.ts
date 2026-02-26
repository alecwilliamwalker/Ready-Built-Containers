import { test, expect } from "@playwright/test";

test.describe("GET /api/catalog/modules", () => {
  test("should return module catalog (200)", async ({ request }) => {
    const res = await request.get("/api/catalog/modules");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.modules).toBeTruthy();
    expect(Array.isArray(body.modules)).toBe(true);
  });

  test("should contain at least 30 modules", async ({ request }) => {
    const res = await request.get("/api/catalog/modules");
    const body = await res.json();
    expect(body.modules.length).toBeGreaterThanOrEqual(30);
  });

  test("should include expected categories", async ({ request }) => {
    const res = await request.get("/api/catalog/modules");
    const body = await res.json();
    const categories = [
      ...new Set(body.modules.map((m: { category: string }) => m.category)),
    ];
    expect(categories).toContain("opening");
    expect(categories).toContain("fixture-bath");
    expect(categories).toContain("fixture-galley");
    expect(categories).toContain("fixture-sleep");
  });

  test("each module should have required fields", async ({ request }) => {
    const res = await request.get("/api/catalog/modules");
    const body = await res.json();
    const first = body.modules[0];
    expect(first.key).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(first.category).toBeTruthy();
    expect(first.schemaJson).toBeTruthy();
    expect(first.priceRuleJson).toBeTruthy();
  });
});
