import { db } from "@/db/index.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import { dbUserToGlobalUserSchema, idNumberSchema } from "@/schema.js";
import { deleteSession } from "@/utils/sessionsHandlers.js";
import { User404Error } from "@/utils/standardErrors.js";
import { Hono } from "hono";

const app = new Hono();

app.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const user = await db.query.users.findFirst({
    columns: { username: true, avatar: true, user_id: true },
    where: { user_id: userId },
  });
  if (!user) {
    //since user doesn't exist better to clean up session and delete it from everywhere
    const sessionId = c.get("sessionId");
    await deleteSession({ c, sessionId });
    throw new User404Error(userId);
  }
  return c.json(dbUserToGlobalUserSchema.parse(user));
});

export default app;
