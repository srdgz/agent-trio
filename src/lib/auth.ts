import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession, sessionKey } from "./session";

const SESSION_SECONDS = 60 * 60 * 8;

function safeEqual(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function verifyCredentials(username: string, password: string) {
  const expectedUser = process.env.DEMO_USER;
  const expectedPassword = process.env.DEMO_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;
  const userMatches = safeEqual(username, expectedUser);
  const passwordMatches = safeEqual(password, expectedPassword);
  return userMatches && passwordMatches;
}

export async function createSession(username: string) {
  const token = await new SignJWT({ sub: username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(sessionKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}
