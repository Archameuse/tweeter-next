import {
  countSchema,
  dbUserSchema,
  emailSchema,
  idNumberSchema,
  idSchema,
  imageLinkSchema,
  looseIdSchema,
  looseUsernameSchema,
  optionalBooleanSchema,
  optionalNullSchema,
  passwordSchema,
  usernameSchema,
} from "@/schema.js";
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

export const dbUserSettingsSchema = dbUserSchema.extend({
  banner: imageLinkSchema.nullish().catch(null),
  status: imageLinkSchema.nullish().catch(null),
  email: emailSchema,
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
      email: db.email,
    }),
  );

export const dbProfileSchema = dbUserSchema.extend({
  followers_count: countSchema,
  following_count: countSchema,
  banner: imageLinkSchema.nullish().catch(null),
  status: imageLinkSchema.nullish().catch(null),
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

export const globalUserSettingsSchema = z.preprocess(
  (val) => {
    if (typeof val === "string")
      try {
        return JSON.parse(val);
      } catch {
        return {};
      }
    return {};
  },
  z.object({
    username: usernameSchema.optional(),
    password: passwordSchema.optional(),
    email: emailSchema.optional(),
    avatar: optionalNullSchema,
    banner: optionalNullSchema,
    status: z.string().nullish(),
  }) satisfies z.ZodType<UserSettingsInput>,
);

export const globalUserSettingsToDbSettingsSchema =
  globalUserSettingsSchema.transform((db) => ({
    username: db.username,
    status: db.status,
    password: db.password,
    email: db.email,
    avatar: imageLinkSchema.nullish().parse(db.avatar),
    banner: imageLinkSchema.nullish().parse(db.banner),
  }));

export const followExistQuerySchema = z.object({
  targetId: idNumberSchema,
  authId: idNumberSchema,
});

export type FollowExistQueryType = z.infer<typeof followExistQuerySchema>;
