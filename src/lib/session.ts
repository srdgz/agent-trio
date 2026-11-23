import { jwtVerify } from "jose";

export const SESSION_COOKIE = "agent_trio_session";

export function sessionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export async function isValidSession(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
