import { db } from "@/db/index.js";
import { follows, users } from "@/db/schema.js";
import { idNumberSchema, imageSchema } from "@/schema.js";
import { UnauthenticatedError, User404Error } from "@/utils/standardErrors.js";
import { and, eq, sql } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
  dbUserSettingsToGlobalUserSettingsSchema,
  followExistQuerySchema,
  FollowExistQueryType,
  globalUserSettingsToDbSettingsSchema,
} from "./users.schema.js";
import uploadImage from "@/utils/uploadImage.js";

const app = new Hono();

const mockUserId = 1;

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
app.post("/follow/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const processedAuthId = idNumberSchema.nullish().parse(mockUserId);
  const processedTargetId = idNumberSchema.parse(id);
  if (!processedAuthId) throw new UnauthenticatedError();
  if (processedAuthId === processedTargetId)
    throw new HTTPException(400, { message: "You cannot follow yourself" });
  const result = await db.transaction(async (tx) => {
    // const users = db.select(users);
    const [exists] = await followExists(tx, {
      authId: processedAuthId,
      targetId: processedTargetId,
    });
    if (!exists) throw new User404Error(processedTargetId);
    if (exists.isFollowed) {
      throw new HTTPException(409, {
        message: `User with id #${processedTargetId} is already followed by user #${processedAuthId}`,
      });
    }
    await tx
      .insert(follows)
      .values({ followed_id: processedTargetId, follower_id: processedAuthId });
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
        .where(eq(users.user_id, processedAuthId))
        .returning({ amount: users.following_count })
    )[0]?.amount;
    if (
      (!newFollowersAmount && newFollowersAmount !== 0) ||
      (!newFollowingAmount && newFollowingAmount !== 0)
    )
      throw new HTTPException(500, {
        message:
          "Follow insertion was successful but did not return new values for whatever reason, try again.",
      });
    return { newFollowersAmount, newFollowingAmount };
  });
  return c.json(result);
});

// follow/:id -> delete -> unfollow from specific user
app.delete("/follow/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const processedAuthId = idNumberSchema.nullish().parse(mockUserId);
  const processedTargetId = idNumberSchema.parse(id);
  if (!processedAuthId) throw new UnauthenticatedError();
  if (processedAuthId === processedTargetId)
    throw new HTTPException(400, { message: "You cannot unfollow yourself" });
  const result = await db.transaction(async (tx) => {
    // const users = db.select(users);
    const [exists] = await followExists(tx, {
      authId: processedAuthId,
      targetId: processedTargetId,
    });
    if (!exists) throw new User404Error(processedTargetId);
    if (!exists.isFollowed) {
      throw new HTTPException(409, {
        message: `User with id #${processedTargetId} is not followed by user #${processedAuthId}`,
      });
    }
    await tx
      .delete(follows)
      .where(
        and(
          eq(follows.followed_id, processedTargetId),
          eq(follows.follower_id, processedAuthId),
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
        .where(eq(users.user_id, processedAuthId))
        .returning({ amount: users.following_count })
    )[0]?.amount;
    if (
      (!newFollowersAmount && newFollowersAmount !== 0) ||
      (!newFollowingAmount && newFollowingAmount !== 0)
    )
      throw new HTTPException(500, {
        message:
          "Follow deletion was successful but did not return new values for whatever reason, try again.",
      });
    return { newFollowersAmount, newFollowingAmount };
  });
  return c.json(result);
});

// settings/:id -> post? -> update settings of specific user
app.put("/settings", async (c) => {
  const processedAuthId = idNumberSchema.nullish().parse(mockUserId);
  if (!processedAuthId) throw new UnauthenticatedError();
  const formData = await c.req.formData();
  const updateSettingsData = globalUserSettingsToDbSettingsSchema.parse(
    formData.get("settings"),
  );
  const avatarImage = imageSchema.parse(formData.get("avatar"));
  const bannerImage = imageSchema.parse(formData.get("banner"));
  // filter out undefined fields
  const filteredSettingsData = Object.fromEntries(
    Object.entries(updateSettingsData).filter(([_, val]) => val !== undefined),
  ) as typeof updateSettingsData;
  if (avatarImage) {
    filteredSettingsData.avatar = await uploadImage(avatarImage);
  }
  if (bannerImage) {
    filteredSettingsData.banner = await uploadImage(bannerImage);
  }
  if (filteredSettingsData.username || filteredSettingsData.email) {
    const [exists] = await db
      .select({
        ...(filteredSettingsData.username && {
          username_taken: sql<boolean>`EXISTS (SELECT 1 FROM ${users} WHERE ${users.username_guard} = ${filteredSettingsData.username.toLowerCase()} AND ${users.user_id} != ${processedAuthId})`,
        }),
        ...(filteredSettingsData.email && {
          email_taken: sql<boolean>`EXISTS (SELECT 1 FROM ${users} WHERE ${users.email_guard} = ${filteredSettingsData.email.toLowerCase()} AND ${users.user_id} != ${processedAuthId})`,
        }),
      })
      .from(users)
      .limit(1);
    if (exists) {
      if (exists.email_taken)
        throw new HTTPException(409, { message: "This email is taken" });
      if (exists.username_taken)
        throw new HTTPException(409, { message: "This username is taken" });
    }
  }
  if (filteredSettingsData.password) {
    // update password with hashed password but for now keep updated password IGNORE IT FOR NOW
  }
  const [res] = await db
    .update(users)
    .set(filteredSettingsData)
    .where(eq(users.user_id, processedAuthId))
    .returning();
  if (!res) throw new User404Error(processedAuthId);
  return c.json(dbUserSettingsToGlobalUserSettingsSchema.parse(res));
});

export default app;
