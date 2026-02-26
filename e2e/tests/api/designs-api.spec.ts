import { test, expect } from "@playwright/test";
import { VALID_DESIGN, uniqueEmail } from "../../fixtures/test-data";

test.describe("Designs API", () => {
  test.describe("unauthenticated", () => {
    test("GET /api/designs should return 401", async ({ request }) => {
      const res = await request.get("/api/designs");
      expect(res.status()).toBe(401);
    });

    test("POST /api/designs should return 401", async ({ request }) => {
      const res = await request.post("/api/designs", { data: VALID_DESIGN });
      expect(res.status()).toBe(401);
    });
  });

  test.describe("authenticated", () => {
    // Each test registers its own user so the request context has the session cookie
    test.beforeEach(async ({ request }) => {
      const email = uniqueEmail("design-api");
      await request.post("/api/auth/register", {
        data: {
          email,
          password: "testpassword123",
          confirmPassword: "testpassword123",
          name: "Design API User",
        },
      });
    });

    test("GET /api/designs should return designs array", async ({
      request,
    }) => {
      const res = await request.get("/api/designs");
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.designs)).toBe(true);
    });

    test("POST /api/designs should create a design (201)", async ({
      request,
    }) => {
      const res = await request.post("/api/designs", { data: VALID_DESIGN });
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.design.id).toBeTruthy();
      expect(body.design.name).toBe(VALID_DESIGN.name);
    });

    test("POST /api/designs should return 400 for invalid payload", async ({
      request,
    }) => {
      const res = await request.post("/api/designs", { data: {} });
      expect(res.status()).toBe(400);
    });

    test("GET /api/designs/[id] should return the design", async ({
      request,
    }) => {
      // Create a design first
      const createRes = await request.post("/api/designs", {
        data: VALID_DESIGN,
      });
      const { design } = await createRes.json();

      const res = await request.get(`/api/designs/${design.id}`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.design.id).toBe(design.id);
    });

    test("GET /api/designs/[id] should return 404 for nonexistent id", async ({
      request,
    }) => {
      const res = await request.get("/api/designs/fake-id-does-not-exist");
      expect(res.status()).toBe(404);
    });

    test("PATCH /api/designs/[id] should update design name", async ({
      request,
    }) => {
      const createRes = await request.post("/api/designs", {
        data: VALID_DESIGN,
      });
      const { design } = await createRes.json();

      const res = await request.patch(`/api/designs/${design.id}`, {
        data: { name: "Updated Name" },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.design.name).toBe("Updated Name");
    });

    test("DELETE /api/designs/[id] should delete the design", async ({
      request,
    }) => {
      const createRes = await request.post("/api/designs", {
        data: VALID_DESIGN,
      });
      const { design } = await createRes.json();

      const delRes = await request.delete(`/api/designs/${design.id}`);
      expect(delRes.status()).toBe(200);

      // Verify it's gone
      const getRes = await request.get(`/api/designs/${design.id}`);
      expect(getRes.status()).toBe(404);
    });

    test("POST /api/designs/[id]/submit should create a submission", async ({
      request,
    }) => {
      const createRes = await request.post("/api/designs", {
        data: VALID_DESIGN,
      });
      const { design } = await createRes.json();

      const res = await request.post(`/api/designs/${design.id}/submit`, {
        data: { notes: "E2E test submission" },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.submission.id).toBeTruthy();
      expect(body.submission.status).toBe("pending");
    });

    test("POST /api/designs/fake-id/submit should return 404", async ({
      request,
    }) => {
      const res = await request.post("/api/designs/fake-id-xyz/submit", {
        data: {},
      });
      expect(res.status()).toBe(404);
    });
  });
});
