import type { APIRequestContext } from "@playwright/test";

export async function createLeadViaAPI(
  request: APIRequestContext,
  data: Record<string, unknown>,
) {
  return request.post("/api/leads", { data });
}

export async function createQuoteViaAPI(
  request: APIRequestContext,
  data: Record<string, unknown>,
) {
  return request.post("/api/quotes", { data });
}

export async function createConsultationViaAPI(
  request: APIRequestContext,
  data: Record<string, unknown>,
) {
  return request.post("/api/consultations", { data });
}

export async function loginAsAdmin(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  return request.post("/api/admin/login", { data: { email, password } });
}

export async function loginAsUser(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  return request.post("/api/auth/login", { data: { email, password } });
}

export async function registerUser(
  request: APIRequestContext,
  data: { email: string; password: string; name: string },
) {
  return request.post("/api/auth/register", {
    data: { ...data, confirmPassword: data.password },
  });
}
