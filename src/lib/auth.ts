import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireEnv } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "readybuilt_admin_session";
const ADMIN_SESSION_TTL_DAYS = 7;

type AdminJwtPayload = {
  sub: string;
  email: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(payload: AdminJwtPayload) {
  const secret = requireEnv("ADMIN_JWT_SECRET");
  return jwt.sign(payload, secret, { expiresIn: `${ADMIN_SESSION_TTL_DAYS}d` });
}

export function verifyAdminToken(token: string) {
  const secret = requireEnv("ADMIN_JWT_SECRET");
  return jwt.verify(token, secret) as AdminJwtPayload & {
    iat: number;
    exp: number;
  };
}

export async function createAdminSessionCookie(payload: AdminJwtPayload) {
  const token = signAdminToken(payload);
  const expires = new Date();
  expires.setDate(expires.getDate() + ADMIN_SESSION_TTL_DAYS);

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return token;
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_SESSION_COOKIE);
  if (!cookie?.value) {
    return null;
  }

  try {
    return verifyAdminToken(cookie.value);
  } catch (error) {
    console.warn("Invalid admin session token", error);
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return null;
  }
}

