import { test, expect } from "@playwright/test";
import { ADMIN_CREDENTIALS, VALID_LEAD, uniqueEmail } from "../../fixtures/test-data";

test.describe("Admin API", () => {
  test.describe("POST /api/admin/login", () => {
    test("should return 200 with valid credentials", async ({ request }) => {
      const res = await request.post("/api/admin/login", {
        data: ADMIN_CREDENTIALS,
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    test("should return 401 for wrong password", async ({ request }) => {
      const res = await request.post("/api/admin/login", {
        data: { email: ADMIN_CREDENTIALS.email, password: "wrongpassword" },
      });
      expect(res.status()).toBe(401);
    });

    test("should return 401 for nonexistent email", async ({ request }) => {
      const res = await request.post("/api/admin/login", {
        data: { email: "fake@test.com", password: "anypassword1" },
      });
      expect(res.status()).toBe(401);
    });

    test("should return 400 for missing fields", async ({ request }) => {
      const res = await request.post("/api/admin/login", { data: {} });
      expect(res.status()).toBe(400);
    });
  });

  test.describe("POST /api/admin/logout", () => {
    test("should return 200", async ({ request }) => {
      const res = await request.post("/api/admin/logout");
      expect(res.status()).toBe(200);
    });
  });

  test.describe("Admin GET endpoints - unauthenticated", () => {
    test("GET /api/admin/leads should return 401", async ({ request }) => {
      // Use a fresh context without admin cookies
      const res = await request.get("/api/admin/leads");
      expect(res.status()).toBe(401);
    });

    test("GET /api/admin/quotes should return 401", async ({ request }) => {
      const res = await request.get("/api/admin/quotes");
      expect(res.status()).toBe(401);
    });

    test("GET /api/admin/consultations should return 401", async ({
      request,
    }) => {
      const res = await request.get("/api/admin/consultations");
      expect(res.status()).toBe(401);
    });

    test("GET /api/admin/reservations should return 401", async ({
      request,
    }) => {
      const res = await request.get("/api/admin/reservations");
      expect(res.status()).toBe(401);
    });
  });

  test.describe("Admin GET endpoints - authenticated", () => {
    test.beforeEach(async ({ request }) => {
      await request.post("/api/admin/login", { data: ADMIN_CREDENTIALS });
    });

    test("GET /api/admin/leads should return 200 with leads array", async ({
      request,
    }) => {
      const res = await request.get("/api/admin/leads");
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.leads)).toBe(true);
    });

    test("GET /api/admin/quotes should return 200", async ({ request }) => {
      const res = await request.get("/api/admin/quotes");
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.quotes)).toBe(true);
    });

    test("GET /api/admin/consultations should return 200", async ({
      request,
    }) => {
      const res = await request.get("/api/admin/consultations");
      expect(res.status()).toBe(200);
    });

    test("GET /api/admin/reservations should return 200", async ({
      request,
    }) => {
      const res = await request.get("/api/admin/reservations");
      expect(res.status()).toBe(200);
    });
  });
});
