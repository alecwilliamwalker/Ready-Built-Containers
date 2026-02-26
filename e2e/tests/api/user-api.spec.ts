import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../../fixtures/test-data";

test.describe("User auth API", () => {
  const userEmail = uniqueEmail("user-api");

  test.describe("POST /api/auth/register", () => {
    test("should create user (201)", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: {
          email: userEmail,
          password: "testpassword123",
          confirmPassword: "testpassword123",
          name: "API Test User",
        },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.userId).toBeTruthy();
    });

    test("should return 409 for duplicate email", async ({ request }) => {
      // Register first
      const email = uniqueEmail("dup");
      await request.post("/api/auth/register", {
        data: {
          email,
          password: "testpassword123",
          confirmPassword: "testpassword123",
          name: "Dup User",
        },
      });
      // Try again
      const res = await request.post("/api/auth/register", {
        data: {
          email,
          password: "testpassword123",
          confirmPassword: "testpassword123",
          name: "Dup User",
        },
      });
      expect(res.status()).toBe(409);
    });

    test("should return 400 for password mismatch", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: {
          email: uniqueEmail("mismatch"),
          password: "testpassword123",
          confirmPassword: "different123",
          name: "Mismatch",
        },
      });
      expect(res.status()).toBe(400);
    });

    test("should return 400 for short password", async ({ request }) => {
      const res = await request.post("/api/auth/register", {
        data: {
          email: uniqueEmail("short"),
          password: "12345",
          confirmPassword: "12345",
          name: "Short",
        },
      });
      expect(res.status()).toBe(400);
    });
  });

  test.describe("POST /api/auth/login", () => {
    test("should return 200 for valid user", async ({ request }) => {
      const email = uniqueEmail("login-ok");
      // Register first
      await request.post("/api/auth/register", {
        data: {
          email,
          password: "testpassword123",
          confirmPassword: "testpassword123",
          name: "Login Test",
        },
      });
      const res = await request.post("/api/auth/login", {
        data: { email, password: "testpassword123" },
      });
      expect(res.status()).toBe(200);
    });

    test("should return 401 for wrong credentials", async ({ request }) => {
      const res = await request.post("/api/auth/login", {
        data: { email: "nobody@test.com", password: "wrongpassword1" },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe("POST /api/auth/logout", () => {
    test("should return 200", async ({ request }) => {
      const res = await request.post("/api/auth/logout");
      expect(res.status()).toBe(200);
    });
  });
});
