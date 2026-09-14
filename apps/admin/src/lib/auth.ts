import { db, users, sessions, eq, and, gt } from "@vortile/database";
import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "vortile_session";
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "operador";
  pin: string;
  isActive: boolean;
}

export const authenticateWithPin = async (
  emailOrPhone: string,
  pin: string
): Promise<SessionUser | null> => {
  const cleanInput = emailOrPhone.trim().toLowerCase();
  const cleanPhone = emailOrPhone.replace(/\D/g, "");

  const allUsers = db.select().from(users).all();
  const user = allUsers.find(
    (u) =>
      (u.email.toLowerCase() === cleanInput || (cleanPhone && u.phone.includes(cleanPhone))) &&
      u.pin === pin.trim() &&
      u.isActive
  );

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as "admin" | "operador",
    pin: user.pin,
    isActive: Boolean(user.isActive),
  };
};

export const createSession = async (userId: string): Promise<string> => {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.insert(sessions)
    .values({
      id: `sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      userId,
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
    })
    .run();

  return token;
};

export const validateSessionToken = async (
  token: string
): Promise<{ user: SessionUser; expiresAt: string } | null> => {
  if (!token) return null;

  const nowIso = new Date().toISOString();
  const sessionRecord = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, nowIso)))
    .get();

  if (!sessionRecord) return null;

  const userRecord = db
    .select()
    .from(users)
    .where(eq(users.id, sessionRecord.userId))
    .get();

  if (!userRecord || !userRecord.isActive) return null;

  return {
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role as "admin" | "operador",
      pin: userRecord.pin,
      isActive: Boolean(userRecord.isActive),
    },
    expiresAt: sessionRecord.expiresAt,
  };
};

export const revokeSession = async (token: string): Promise<boolean> => {
  if (!token) return false;
  db.delete(sessions).where(eq(sessions.token, token)).run();
  return true;
};
