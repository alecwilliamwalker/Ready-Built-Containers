import { test, expect } from "@playwright/test";
import { VALID_LEAD, uniqueEmail } from "../../fixtures/test-data";

test.describe("POST /api/leads", () => {
  test("should create lead with valid data (201)", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { ...VALID_LEAD, email: uniqueEmail("lead") },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBeTruthy();
  });

  test("should return 400 for missing name", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { email: "test@test.com", source: "e2e" },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for invalid email", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { name: "Test", email: "not-valid", source: "e2e" },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for missing source", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { name: "Test", email: "test@test.com" },
    });
    expect(res.status()).toBe(400);
  });

  test("should accept optional fields as empty (201)", async ({ request }) => {
    const res = await request.post("/api/leads", {
      data: { name: "Minimal", email: uniqueEmail("lead"), source: "e2e" },
    });
    expect(res.status()).toBe(201);
  });
});
