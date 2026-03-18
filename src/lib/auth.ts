import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions, players } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE = "session_id";
const SESSION_DURATION_DAYS = 30;

export async function createSession(playerId: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const [session] = await db
    .insert(sessions)
    .values({ playerId, expiresAt })
    .returning();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const [result] = await db
    .select({ session: sessions, player: players })
    .from(sessions)
    .innerJoin(players, eq(sessions.playerId, players.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!result) {
    // Expired or invalid — clear cookie
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return result;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete(SESSION_COOKIE);
  }
}
