import { db } from "@/db/index.js";
import { follows, likes, retweets, saves, tweets, users } from "@/db/schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UnauthenticatedError, User404Error } from "@/utils/standardErrors.js";
import {
  clearSessionsByUID,
  createSession,
  deleteSession,
} from "@/utils/sessionsHandlers.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import {
  createUserSchema,
  deleteUserSchema,
  loginUserSchema,
} from "./auth.schema.js";
import { dbUserToGlobalUserSchema } from "@/schema.js";
import { and, eq, sql, ne, exists } from "drizzle-orm";
import { hashPw, verifyPw } from "@/utils/passwordHandlers.js";
import { alias } from "drizzle-orm/sqlite-core";

const app = new Hono();

app.post("/create", async (c) => {
  const body = await c.req.json();
  const { email, password, username } = createUserSchema.parse(body);
  const res = await db.transaction(async (tx) => {
    const emailExists = await tx.query.users.findFirst({
      columns: {},
      extras: { exist: sql`1` },
      where: { email_guard: email.toLowerCase() },
    });
    if (emailExists) {
      throw new HTTPException(409, {
        message: `Email "${email.toLowerCase()}" is already exists.`,
      });
    }
    const usernameExists = await tx.query.users.findFirst({
      columns: {},
      extras: { exist: sql`1` },
      where: { username_guard: username.toLowerCase() },
    });
    if (usernameExists) {
      throw new HTTPException(409, {
        message: `Username "${username.toLowerCase()}" is already exists.`,
      });
    }
    const hashedPassword = await hashPw(password);
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
  return c.json(res, 201); //?
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
  if (!res || !(await verifyPw(password, res.password))) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }
  const { password: _, ...user } = res;
  const cleanUser = dbUserToGlobalUserSchema.parse(user);
  await createSession({ c, userId: cleanUser.id });
  // readdress to /
  return c.json(cleanUser, 200);
});

app.post("/logout", authMiddleware, async (c) => {
  const sessionId = c.get("sessionId");
  await deleteSession({ sessionId, c });
  return c.body(null, 204);
});

app.post("/delete", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { password } = deleteUserSchema.parse(body);
  const userId = c.get("userId");
  const isFixed = await db.query.users.findFirst({
    columns: { fixed_user: true },
    where: { user_id: userId },
  });
  if (isFixed?.fixed_user)
    throw new HTTPException(400, {
      message:
        "This user exists for testing purposes hence its fixed, meaning its impossible delete it via API calls, create new one.",
    });
  const actualPassword = (
    await db.query.users.findFirst({
      columns: { password: true },
      where: { user_id: userId },
    })
  )?.password;
  if (!actualPassword) throw new User404Error(userId);
  if (!(await verifyPw(password, actualPassword)))
    throw new HTTPException(409, { message: "Wrong password" });
  await clearSessionsByUID(userId);
  await deleteSession({ c });
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ followers_count: sql<number>`${users.followers_count} - 1` })
      .where(
        exists(
          tx
            .select({ a: sql`1` })
            .from(follows)
            .where(
              and(
                eq(follows.follower_id, userId),
                eq(follows.followed_id, users.user_id),
              ),
            ),
        ),
      );
    await tx
      .update(users)
      .set({ following_count: sql<number>`${users.following_count} - 1` })
      .where(
        exists(
          tx
            .select({ a: sql`1` })
            .from(follows)
            .where(
              and(
                eq(follows.followed_id, userId),
                eq(follows.follower_id, users.user_id),
              ),
            ),
        ),
      );
    await tx
      .update(tweets)
      .set({ likes_count: sql<number>`${tweets.likes_count} - 1` })
      .where(
        and(
          ne(tweets.user_id, userId),
          exists(
            tx
              .select({ a: sql`1` })
              .from(likes)
              .where(
                and(
                  eq(likes.user_id, userId),
                  eq(likes.tweet_id, tweets.tweet_id),
                ),
              ),
          ),
        ),
      );
    await tx
      .update(tweets)
      .set({ saves_count: sql<number>`${tweets.saves_count} - 1` })
      .where(
        and(
          ne(tweets.user_id, userId),
          exists(
            tx
              .select({ a: sql`1` })
              .from(saves)
              .where(
                and(
                  eq(saves.user_id, userId),
                  eq(saves.tweet_id, tweets.tweet_id),
                ),
              ),
          ),
        ),
      );
    await tx
      .update(tweets)
      .set({ retweets_count: sql<number>`${tweets.retweets_count} - 1` })
      .where(
        and(
          ne(tweets.user_id, userId),
          exists(
            tx
              .select({ a: sql`1` })
              .from(retweets)
              .where(
                and(
                  eq(retweets.user_id, userId),
                  eq(retweets.tweet_id, tweets.tweet_id),
                ),
              ),
          ),
        ),
      );
    const reply = alias(tweets, "reply");
    await tx
      .update(tweets)
      .set({
        replies_count: sql<number>`${tweets.replies_count} - (
        SELECT COUNT(*)
        FROM ${reply}
        WHERE ${reply.reply_to} = ${tweets.tweet_id}
        AND ${reply.user_id} = ${userId}
        )`,
      })
      .where(
        and(
          ne(tweets.user_id, userId),
          exists(
            tx
              .select({ a: sql`1` })
              .from(reply)
              .where(
                and(
                  eq(reply.reply_to, tweets.tweet_id),
                  eq(reply.user_id, userId),
                ),
              ),
          ),
        ),
      );
    await tx.delete(users).where(eq(users.user_id, userId));
  });
  return c.body(null, 204);
});

export default app;
