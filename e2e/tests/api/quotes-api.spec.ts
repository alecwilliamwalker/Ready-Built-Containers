import { test, expect } from "@playwright/test";
import { VALID_QUOTE, uniqueEmail } from "../../fixtures/test-data";

test.describe("POST /api/quotes", () => {
  test("should create quote with valid data (201)", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: { ...VALID_QUOTE, email: uniqueEmail("quote") },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.quoteId).toBeTruthy();
  });

  test("should return 400 for missing name", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: { email: "test@test.com" },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for invalid email", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: { name: "Test", email: "bad" },
    });
    expect(res.status()).toBe(400);
  });

  test("should accept minimal required fields (201)", async ({ request }) => {
    const res = await request.post("/api/quotes", {
      data: { name: "Minimal", email: uniqueEmail("quote") },
    });
    expect(res.status()).toBe(201);
  });
});
