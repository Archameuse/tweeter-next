import { idSchema } from "@/schema.js";
import z from "zod";

export enum USER_SCOPE {
  user = "user",
  settings = "settings",
  profile = "profile",
}

export enum FOLLOW_SCOPE {
  followers = "followers",
  follows = "follows",
}

export const dbUserSchema = z.object({
  user_id: idSchema,
  username: z.string(),
  avatar: z.string().nullish(),
  is_followed: z.coerce.boolean().optional(),
});

export const dbUserToGlobalUserSchema = dbUserSchema.transform(
  (db): User => ({
    id: db.user_id,
    username: db.username,
    avatar: db.avatar,
    followed: db.is_followed,
  }),
);

export const dbUserSettingsSchema = dbUserSchema.extend({
  banner: z.string().nullish(),
  status: z.string().nullish(),
});

export const dbUserSettingsToGlobalUserSettingsSchema =
  dbUserSettingsSchema.transform(
    (db): UserSettings => ({
      id: db.user_id,
      username: db.username,
      avatar: db.avatar,
      followed: db.is_followed,
      banner: db.banner,
      status: db.status,
    }),
  );

export const dbProfileSchema = dbUserSettingsSchema.extend({
  followers_count: z.number().int().min(0).catch(0),
  following_count: z.number().int().min(0).catch(0),
});

export const dbProfileToGlobalProfileSchema = dbProfileSchema.transform(
  (db): Profile => ({
    id: db.user_id,
    username: db.username,
    avatar: db.avatar,
    followed: db.is_followed,
    banner: db.banner,
    status: db.status,
    followers: db.followers_count,
    following: db.following_count,
  }),
);
