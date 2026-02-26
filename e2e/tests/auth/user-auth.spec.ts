import { test, expect } from "@playwright/test";
import { uniqueEmail } from "../../fixtures/test-data";

// User auth tests via API (no browser needed)
test.describe("User auth via API", () => {
  const email = uniqueEmail("auth-ui");

  test("should register a new user via API", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        email,
        password: "testpassword123",
        confirmPassword: "testpassword123",
        name: "Auth UI Test",
      },
    });
    expect(res.status()).toBe(200);
  });

  test("should login with registered credentials", async ({ request }) => {
    const loginEmail = uniqueEmail("login-ui");
    await request.post("/api/auth/register", {
      data: {
        email: loginEmail,
        password: "testpassword123",
        confirmPassword: "testpassword123",
        name: "Login Test",
      },
    });

    const res = await request.post("/api/auth/login", {
      data: { email: loginEmail, password: "testpassword123" },
    });
    expect(res.status()).toBe(200);
  });

  test("should return 401 for wrong password", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "nobody@test.com", password: "wrongpassword1" },
    });
    expect(res.status()).toBe(401);
  });

  test("should logout successfully", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBe(200);
  });
});
