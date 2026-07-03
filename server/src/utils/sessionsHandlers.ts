import { db } from "@/db/index.js";
import { sessions } from "@/db/schema.js";
import sessionsCache from "@/db/sessionsCache.js";
import { idNumberSchema } from "@/schema.js";
import { eq } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { UnauthenticatedError } from "./standardErrors.js";

export const COOKIE_NAME = process.env.SESSION_NAME ?? "session_id";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: "Lax",
  path: "/",
} as const;

export enum VALIDATION_STATE {
  valid,
  invalid_date,
  invalid_agent,
  invalid_ip,
}

/**
 *
 * @param sessionId If not passed then skip deletion from cache & db
 * @param c If c passed then this function will also delete cookie with this id
 * @param dbOrTx If not passed than just default db, otherwise can pass transaction tx
 */
export const deleteSession = async ({
  dbOrTx = db,
  sessionId,
  c,
}: {
  sessionId?: string;
  c?: Context;
  dbOrTx?: typeof db | SQLiteTransaction<"async", any, any>;
}) => {
  if (sessionId) {
    try {
      await dbOrTx.delete(sessions).where(eq(sessions.session_id, sessionId));
    } catch (error) {
      console.error("Error deleting session from database, ignoring", error);
    }
    try {
      sessionsCache.del(sessionId);
    } catch (error) {
      console.error("Error deleting session, ignoring", error);
    }
  }
  if (c) {
    deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
  }
};

export const createSession = async ({
  dbOrTx = db,
  userId,
  c,
}: {
  c: Context;
  userId: number | string;
  dbOrTx?: typeof db | SQLiteTransaction<"async", any, any>;
}) => {
  const prevSession = getCookie(c, COOKIE_NAME);
  if (prevSession) {
    await deleteSession({ sessionId: prevSession, dbOrTx });
  }
  const sessionId = crypto.randomUUID();
  const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days
  const ipAddress = "123.123.1.1"; // mock
  const userAgent = "chrome"; // mock
  const clearUserId = idNumberSchema.parse(userId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AGE_SEC * 1000); //sec to  ms
  const newSessionData = {
    session_id: sessionId,
    expires_at: expiresAt,
    ip_address: ipAddress,
    user_agent: userAgent,
    user_id: clearUserId,
  } as typeof sessions.$inferInsert;
  await dbOrTx.insert(sessions).values(newSessionData);
  try {
    sessionsCache.set(sessionId, newSessionData);
  } catch (error) {
    console.error("Error inserting session to cache, ignoring", error);
  }

  setCookie(c, COOKIE_NAME, sessionId, {
    ...COOKIE_OPTIONS,
    maxAge: MAX_AGE_SEC,
    priority: "High",
  });
};

export const getSession = async (
  c: Context,
): Promise<typeof sessions.$inferSelect | undefined> => {
  const sessionId = getCookie(c, COOKIE_NAME);
  if (!sessionId) throw new UnauthenticatedError();
  let session: typeof sessions.$inferSelect | undefined =
    sessionsCache.get(sessionId);
  if (!session) {
    try {
      session = await db.query.sessions.findFirst({
        where: { session_id: sessionId },
      });
      if (session) {
        sessionsCache.set(sessionId, session);
      }
    } catch (error) {
      console.error("Failed to retrieve session from DB", error);
    }
  }
  return session;
};

export const validateSession = (
  session: typeof sessions.$inferSelect,
): VALIDATION_STATE => {
  if (session.expires_at < new Date()) return VALIDATION_STATE.invalid_date;
  // more validations like ip and user agent would be here added later
  return VALIDATION_STATE.valid;
};
