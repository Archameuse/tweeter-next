import { db } from "@/db/index.js";
import { users } from "@/db/schema.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UnauthenticatedError } from "@/utils/standardErrors.js";
import { createSession, deleteSession } from "@/utils/sessionsHandlers.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import { createUserSchema, loginUserSchema } from "./auth.schema.js";
import { dbUserToGlobalUserSchema } from "@/schema.js";
import { sql } from "drizzle-orm";

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
  // confirm user exists + compares password for now just basic equation later would implement hash validation
  if (!res || res.password !== password) {
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

export default app;
