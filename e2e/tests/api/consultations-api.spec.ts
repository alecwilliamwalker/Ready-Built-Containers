import { test, expect } from "@playwright/test";
import { VALID_CONSULTATION, uniqueEmail } from "../../fixtures/test-data";

test.describe("POST /api/consultations", () => {
  test("should create consultation with valid data (201)", async ({
    request,
  }) => {
    const res = await request.post("/api/consultations", {
      data: { ...VALID_CONSULTATION, email: uniqueEmail("consult") },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.consultationId).toBeTruthy();
  });

  test("should return 400 for missing name", async ({ request }) => {
    const res = await request.post("/api/consultations", {
      data: { email: "test@test.com" },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for invalid email", async ({ request }) => {
    const res = await request.post("/api/consultations", {
      data: { name: "Test", email: "bad" },
    });
    expect(res.status()).toBe(400);
  });

  test("should accept optional date and timezone (201)", async ({
    request,
  }) => {
    const res = await request.post("/api/consultations", {
      data: {
        name: "Full Data",
        email: uniqueEmail("consult"),
        preferredDate: "2026-06-15",
        timeZone: "Central",
      },
    });
    expect(res.status()).toBe(201);
  });
});
