import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireEnv } from "@/lib/env";

export const USER_SESSION_COOKIE = "readybuilt_user_session";
const USER_SESSION_TTL_DAYS = 14;

type UserJwtPayload = {
  sub: string;
  email: string;
};

export async function hashUserPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyUserPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function getUserJwtSecret() {
  return requireEnv("USER_JWT_SECRET");
}

export function signUserToken(payload: UserJwtPayload) {
  return jwt.sign(payload, getUserJwtSecret(), { expiresIn: `${USER_SESSION_TTL_DAYS}d` });
}

export function verifyUserToken(token: string) {
  return jwt.verify(token, getUserJwtSecret()) as UserJwtPayload & {
    iat: number;
    exp: number;
  };
}

export async function createUserSessionCookie(payload: UserJwtPayload) {
  const token = signUserToken(payload);
  const expires = new Date();
  expires.setDate(expires.getDate() + USER_SESSION_TTL_DAYS);

  const cookieStore = await cookies();
  cookieStore.set({
    name: USER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });

  return token;
}

export async function clearUserSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(USER_SESSION_COOKIE);
  if (!cookie?.value) {
    return null;
  }

  try {
    return verifyUserToken(cookie.value);
  } catch (error) {
    console.warn("Invalid user session token", error);
    cookieStore.delete(USER_SESSION_COOKIE);
    return null;
  }
}

