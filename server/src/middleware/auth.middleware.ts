import { idNumberSchema, idSchema } from "#/schema.js";
import {
  deleteSession,
  getSession,
  refreshSession,
  validateSession,
  VALIDATION_STATE,
} from "#/utils/sessionsHandlers.js";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import z from "zod";

type AuthVariables = {
  sessionId: string;
  userId: z.infer<typeof idNumberSchema>;
};

export const authMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c, next) => {
  const session = await getSession(c);
  if (!session) {
    //means no session in both cache and database so invalidate and just delete cookie
    // no reason to clear database or cache
    await deleteSession({ c });
    throw new HTTPException(401, { message: "Session does not exist" });
  }
  const validation = validateSession(session);
  switch (validation) {
    case VALIDATION_STATE.valid: //actually validate user and pass along userId and sessionId (for logout)
      c.set("userId", idNumberSchema.parse(session.user_id));
      c.set("sessionId", session.session_id);
      try {
        await refreshSession({ c, session });
      } catch (error) {
        console.error("Failed to refresh session, ignoring", error);
      }
      await next();
      break;
    case VALIDATION_STATE.invalid_date: //prevent validation, delete cookie AND clear expired session
      await deleteSession({ c, sessionId: session.session_id });
      throw new HTTPException(401, { message: "Session expired" });
    default: //in all other cases just prevent validation and delete cookie
      // make some kind of a call to user maybe add field for session when its
      // compromised so next time he logs in we give him a prompt to logout and invalidate session
      // for now tho also just deletion
      await deleteSession({ c, sessionId: session.session_id });
      throw new HTTPException(401, { message: "Session is invalid" }); //mismatch agent or ip for example

    //means session exists but it is invalid
  }
});

export const optionalAuthMiddleware = createMiddleware<{
  Variables: Partial<AuthVariables>;
}>(async (c, next) => {
  try {
    const session = await getSession(c);
    if (session) {
      const validation = validateSession(session);
      if (validation === VALIDATION_STATE.valid) {
        c.set("userId", idNumberSchema.parse(session.user_id));
        c.set("sessionId", session.session_id);
      }
    }
  } catch {}
  await next();
});
