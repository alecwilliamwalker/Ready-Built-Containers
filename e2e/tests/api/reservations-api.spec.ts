import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../../fixtures/test-data";

test.describe("POST /api/reservations/checkout", () => {
  test("should return 400 for missing name", async ({ request }) => {
    const res = await request.post("/api/reservations/checkout", {
      data: { email: "test@test.com", confirmTerms: true },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for unchecked terms", async ({ request }) => {
    const res = await request.post("/api/reservations/checkout", {
      data: {
        name: "Test",
        email: uniqueEmail("reserve"),
        confirmTerms: false,
      },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 400 for invalid email", async ({ request }) => {
    const res = await request.post("/api/reservations/checkout", {
      data: { name: "Test", email: "bad", confirmTerms: true },
    });
    expect(res.status()).toBe(400);
  });

  test("should return 500 when Stripe is not configured", async ({
    request,
  }) => {
    const res = await request.post("/api/reservations/checkout", {
      data: {
        name: "Test Reserve",
        email: uniqueEmail("reserve"),
        confirmTerms: true,
      },
    });
    // Without STRIPE_SECRET_KEY, should get a server error
    expect(res.status()).toBe(500);
  });
});
