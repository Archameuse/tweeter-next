import { db } from "@/db/index.js";
import { sessions, users } from "@/db/schema.js";
import {
  emailSchema,
  idNumberSchema,
  passwordSchema,
  usernameSchema,
} from "@/schema.js";
import { eq, sql } from "drizzle-orm";
import { Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import { dbUserToGlobalUserSchema } from "../users/users.schema.js";
import { v4 } from "uuid";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import sessionsCache from "@/db/sessionsCache.js";
import {
  Session404Error,
  UnauthenticatedError,
} from "@/utils/standardErrors.js";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";

const app = new Hono();
const COOKIE_NAME = process.env.SESSION_NAME ?? "session_id";

const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
}) satisfies z.ZodType<UserCreateInput>;

const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}) satisfies z.ZodType<UserLoginInput>;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "Lax",
  path: "/",
} as const;

/**
 *
 * @param sessionId
 * @param c If c passed then this function will also delete cookie with this id
 * @param dbOrTx If not passed than just default db, otherwise can pass transaction tx
 */
const deleteSession = async ({
  dbOrTx = db,
  sessionId,
  c,
}: {
  sessionId: string;
  c?: Context;
  dbOrTx?: typeof db | SQLiteTransaction<"async", any, any>;
}) => {
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
  if (c) {
    deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
  }
};

const createSession = async ({
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

app.post("/create", async (c) => {
  const body = await c.req.json();
  const { email, password, username } = createUserSchema.parse(body);
  const res = await db.transaction(async (tx) => {
    const emailExists = await tx.query.users.findFirst({
      columns: {},
      where: { email_guard: email.toLowerCase() },
    });
    if (emailExists) {
      throw new HTTPException(409, {
        message: `Email "${email.toLowerCase()}" is already exists.`,
      });
    }
    const usernameExists = await tx.query.users.findFirst({
      columns: {},
      where: { username_guard: username.toLowerCase() },
    });
    if (usernameExists) {
      throw new HTTPException(409, {
        message: `Username "${username.toLowerCase()}" is already exists.`,
      });
    }
    const hashedPassword = password; //ignore for now, later implement some actual hashing
    const [newUser] = await tx
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,
      })
      .returning({
        user_id: users.user_id,
        username: users.username,
      });
    if (!newUser)
      throw new HTTPException(500, {
        message:
          "User was inserted successfully but for some reason his data was never returned, try again.",
      });
    const parsedUser = dbUserToGlobalUserSchema.parse(newUser);
    await createSession({ c, userId: parsedUser.id, dbOrTx: tx });
    return parsedUser;
  });
  // readdress to /
  return c.json(res); //?
});

app.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = loginUserSchema.parse(body);
  const res = await db.query.users.findFirst({
    columns: { password: true, avatar: true, username: true, user_id: true },
    where: {
      email_guard: email.toLowerCase(),
    },
  });
  // confirm user exists + compares password for now just basic equation later would implement hash validation
  if (!res || res.password !== password) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }
  const { password: _, ...user } = res;
  const cleanUser = dbUserToGlobalUserSchema.parse(user);
  await createSession({ c, userId: cleanUser.id });
  // readdress to /
  return c.json(cleanUser);
});

app.post("/logout", async (c) => {
  const sessionId = getCookie(c, COOKIE_NAME);
  if (!sessionId) throw new UnauthenticatedError();
  await deleteSession({ sessionId, c });
  return c.body(null, 204);
});

export default app;
