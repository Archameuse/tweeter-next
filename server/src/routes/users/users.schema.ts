import { idNumberSchema, idSchema } from "@/schema.js";
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

export const globalUserSettingsSchema = z.preprocess(
  (val) => {
    if (typeof val === "string")
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    return val;
  },
  z.object({
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z]+[a-zA-Z0-9 ]*$/, {
        error:
          "Username must start with at least 1 letter and contain only latin letters and numbers",
      })
      .refine((val) => val.split(" ").length <= 2, {
        error: "Username must contain at most one space",
      })
      .optional(),
    password: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .regex(/^[\S]+@[\S]+$/)
      .optional(),
    avatar: z.null().optional().catch(undefined),
    banner: z.null().optional().catch(undefined),
    status: z.string().nullish(),
  }) satisfies z.ZodType<UserSettingsInput>,
);

export const globalUserSettingsToDbSettingsSchema =
  globalUserSettingsSchema.transform((db) => ({
    username: db.username,
    status: db.status,
    password: db.password,
    email: db.email,
    avatar: z.string().nullish().parse(db.avatar),
    banner: z.string().nullish().parse(db.banner),
  }));

export const followExistQuerySchema = z.object({
  targetId: idNumberSchema,
  authId: idNumberSchema,
});

export type FollowExistQueryType = z.infer<typeof followExistQuerySchema>;
