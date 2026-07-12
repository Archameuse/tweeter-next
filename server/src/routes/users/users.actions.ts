import { db } from "@/db/index.js";
import { follows, sessions, users } from "@/db/schema.js";
import { idNumberSchema, imageSchema } from "@/schema.js";
import { ActionNoReturnError, User404Error } from "@/utils/standardErrors.js";
import { and, eq, getColumns, ne, sql } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  dbUserSettingsToGlobalUserSettingsSchema,
  followExistQuerySchema,
  FollowExistQueryType,
  globalUserSettingsSchema,
  globalUserSettingsToDbSettingsSchema,
  GlobalUserSettingsToDbSettingsType,
} from "./users.schema.js";
import uploadImage from "@/utils/uploadImage.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";
import { clearSessionsByUID, createSession } from "@/utils/sessionsHandlers.js";
import { hashPw, verifyPw } from "@/utils/passwordHandlers.js";

const app = new Hono();

const followExists = (
  tx: SQLiteTransaction<"async", any, any>,
  query: FollowExistQueryType,
) => {
  const { authId, targetId } = followExistQuerySchema.parse(query);
  return tx
    .select({
      isFollowed: sql<boolean>`
        EXISTS (
            SELECT 1
            FROM ${follows}
            WHERE ${follows.follower_id} = ${authId}
            AND ${follows.followed_id} = ${targetId}
        )
        `,
    })
    .from(users)
    .where(eq(users.user_id, targetId));
};

// follow/:id -> post -> follow to specific user
app.post("/follow/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const authId = c.get("userId");
  const processedTargetId = idNumberSchema.parse(id);
  if (authId === processedTargetId)
    throw new HTTPException(400, { message: "You cannot follow yourself" });
  const result = await db.transaction(async (tx) => {
    // const users = db.select(users);
    const [exists] = await followExists(tx, {
      authId,
      targetId: processedTargetId,
    });
    if (!exists) throw new User404Error(processedTargetId);
    if (exists.isFollowed) {
      throw new HTTPException(409, {
        message: `User with id #${processedTargetId} is already followed by user #${authId}`,
      });
    }
    await tx
      .insert(follows)
      .values({ followed_id: processedTargetId, follower_id: authId });
    const newFollowersAmount = (
      await tx
        .update(users)
        .set({ followers_count: sql<number>`${users.followers_count} + 1` })
        .where(eq(users.user_id, processedTargetId))
        .returning({ amount: users.followers_count })
    )[0]?.amount;
    const newFollowingAmount = (
      await tx
        .update(users)
        .set({ following_count: sql<number>`${users.following_count} + 1` })
        .where(eq(users.user_id, authId))
        .returning({ amount: users.following_count })
    )[0]?.amount;
    if (
      (!newFollowersAmount && newFollowersAmount !== 0) ||
      (!newFollowingAmount && newFollowingAmount !== 0)
    )
      throw new ActionNoReturnError("Follow insertion");
    return { newFollowersAmount, newFollowingAmount };
  });
  return c.json(result, 201);
});

// follow/:id -> delete -> unfollow from specific user
app.delete("/follow/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const authId = c.get("userId");
  const processedTargetId = idNumberSchema.parse(id);
  if (authId === processedTargetId)
    throw new HTTPException(400, { message: "You cannot unfollow yourself" });
  const result = await db.transaction(async (tx) => {
    // const users = db.select(users);
    const [exists] = await followExists(tx, {
      authId,
      targetId: processedTargetId,
    });
    if (!exists) throw new User404Error(processedTargetId);
    if (!exists.isFollowed) {
      throw new HTTPException(409, {
        message: `User with id #${processedTargetId} is not followed by user #${authId}`,
      });
    }
    await tx
      .delete(follows)
      .where(
        and(
          eq(follows.followed_id, processedTargetId),
          eq(follows.follower_id, authId),
        ),
      );

    const newFollowersAmount = (
      await tx
        .update(users)
        .set({ followers_count: sql<number>`${users.followers_count} - 1` })
        .where(eq(users.user_id, processedTargetId))
        .returning({ amount: users.followers_count })
    )[0]?.amount;
    const newFollowingAmount = (
      await tx
        .update(users)
        .set({ following_count: sql<number>`${users.following_count} - 1` })
        .where(eq(users.user_id, authId))
        .returning({ amount: users.following_count })
    )[0]?.amount;
    if (
      (!newFollowersAmount && newFollowersAmount !== 0) ||
      (!newFollowingAmount && newFollowingAmount !== 0)
    )
      throw new ActionNoReturnError("Follow deletion");
    return { newFollowersAmount, newFollowingAmount };
  });
  return c.json(result, 200);
});

// settings/:id -> post? -> update settings of specific user
/**
 * pass image (or status) as null to remove it
 */
app.put("/settings", authMiddleware, async (c) => {
  const authId = c.get("userId");
  const formData = await c.req.formData();
  // const updateSettingsData = globalUserSettingsToDbSettingsSchema.parse(
  //   formData.get("settings"),
  // );
  const updateSettingsQuery = globalUserSettingsSchema.parse(
    formData.get("settings"),
  );
  const filteredSettingsQuery: Partial<GlobalUserSettingsToDbSettingsType> = {};
  const avatarImage = imageSchema.parse(formData.get("avatar"));
  const bannerImage = imageSchema.parse(formData.get("banner"));

  if (avatarImage) {
    //set avatar
    filteredSettingsQuery.avatar = await uploadImage(avatarImage);
  } else if (avatarImage === null) {
    filteredSettingsQuery.avatar = null;
  }
  if (bannerImage) {
    //set banner
    filteredSettingsQuery.banner = await uploadImage(bannerImage);
  } else if (bannerImage === null) {
    filteredSettingsQuery.banner = null;
  }
  if (updateSettingsQuery.username || updateSettingsQuery.email) {
    const [exists] = await db
      .select({
        ...(updateSettingsQuery.username && {
          username_taken: sql<boolean>`EXISTS (SELECT 1 FROM ${users} WHERE ${users.username_guard} = ${updateSettingsQuery.username.toLowerCase()} AND ${users.user_id} != ${authId})`,
        }),
        ...(updateSettingsQuery.email && {
          email_taken: sql<boolean>`EXISTS (SELECT 1 FROM ${users} WHERE ${users.email_guard} = ${updateSettingsQuery.email.toLowerCase()} AND ${users.user_id} != ${authId})`,
        }),
      })
      .from(users)
      .limit(1);
    if (exists) {
      if (exists.email_taken)
        throw new HTTPException(409, { message: "This email is taken" });
      if (exists.username_taken)
        throw new HTTPException(409, { message: "This username is taken" });
      if (updateSettingsQuery.username)
        filteredSettingsQuery.username = updateSettingsQuery.username; //set username
      if (updateSettingsQuery.email)
        filteredSettingsQuery.email = updateSettingsQuery.email; //set email
    }
  }
  if (updateSettingsQuery.status || updateSettingsQuery.status === null)
    filteredSettingsQuery.status = updateSettingsQuery.status; //set status
  if (updateSettingsQuery.password) {
    if (!updateSettingsQuery.oldPassword)
      throw new HTTPException(400, { message: "No old password provided" });
    const currentPw = (
      await db.query.users.findFirst({
        columns: { password: true },
        where: { user_id: authId },
      })
    )?.password;
    if (!currentPw)
      throw new HTTPException(500, {
        message:
          "For some reason can't get currently logged in user's password, unable to proceed",
      });
    if (!(await verifyPw(updateSettingsQuery.oldPassword, currentPw)))
      throw new HTTPException(400, { message: "Wrong old password provided" });
    filteredSettingsQuery.password = await hashPw(updateSettingsQuery.password); // set password
  }
  if (Object.keys(updateSettingsQuery).length < 1)
    throw new HTTPException(409, { message: "Empty request" });

  const [res] = await db
    .update(users)
    .set(filteredSettingsQuery)
    .where(eq(users.user_id, authId))
    .returning({
      user_id: users.user_id,
      username: users.username,
      email: users.email,
      avatar: users.avatar,
      banner: users.banner,
      status: users.status,
    });
  if (!res) throw new User404Error(authId);
  // invalidating sessions since password is changed
  if (filteredSettingsQuery.password) {
    await clearSessionsByUID(authId);
    await createSession({ userId: authId, c, skipDeletion: true });
  }
  return c.json(dbUserSettingsToGlobalUserSettingsSchema.parse(res), 201);
});

export default app;
