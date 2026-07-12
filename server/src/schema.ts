import z from "zod";

const MAX_SIZE = 20;

export const imageSchema = z.preprocess(
  (val) => {
    if (val === "null") return null;
    if (!val || (val instanceof File && val.size === 0)) return undefined;
    return val;
  },
  z
    .file({ error: `Image should be a file` })
    .min(50, { error: `Min size - 50 bytes` })
    .max(MAX_SIZE * 1024 * 1024, { error: `Max size - ${MAX_SIZE} mb` })
    .mime(["image/jpeg", "image/png", "image/webp", "image/gif"], {
      error: "Wrong image extension",
    }) //remove gif eventually
    .nullish(),
);

export const imageLinkSchema = z.string();

export const idSchema = z.coerce
  .string()
  .trim()
  .regex(/^\d+$/, { error: "Id must contain only and at least 1 digits" });

export const looseIdSchema = idSchema.catch((ctx) => {
  console.error(`Corrupt id #${ctx.value}:`, ctx.issues);
  return String(ctx);
});

export const idNumberSchema = idSchema
  .transform(Number)
  .pipe(z.number().min(1).int());

export const emailSchema = z
  .string()
  .trim()
  .regex(/^[\S]+@[\S]+$/);

export const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z]+[a-zA-Z0-9 ]*$/, {
    error:
      "Username must start with at least 1 letter and contain only latin letters and numbers",
  })
  .refine((val) => val.split(" ").length <= 2, {
    error: "Username must contain at most one space",
  });

export const looseUsernameSchema = usernameSchema.catch((ctx) => {
  console.error(`Corrupt username "${ctx.value}":`, ctx.issues);
  return "Unknown";
});

/**
 * Need to add validation later that this is in fact correct password
 */
export const passwordSchema = z.string().trim();

/**
 * Need to add validation later that this is in fact correct HASHED password
 */
export const hashedPasswordSchema = z.string().trim();

export const optionalBooleanSchema = z.coerce.boolean().optional();

export const countSchema = z.number().int().min(0).catch(0);

export const optionalNullSchema = z.null().optional().catch(undefined);

export const hashtagSchema = z
  .string()
  .trim()
  .max(64)
  .regex(/^[a-zA-Z]+[a-zA-Z0-9]*$/, {
    error:
      "Hashtag string must start with at least 1 letter and contain only latin letters and numbers",
  });

/**
 * dbUserSchema and dbUserToGlobalUserSchema are here because they are reusable in auth route
 */
export const dbUserSchema = z.object({
  user_id: looseIdSchema,
  username: looseUsernameSchema,
  avatar: imageLinkSchema.nullish().catch(null),
  is_followed: optionalBooleanSchema,
});
export const dbUserToGlobalUserSchema = dbUserSchema.transform(
  (db): User => ({
    id: db.user_id,
    username: db.username,
    avatar: db.avatar,
    followed: db.is_followed,
  }),
);

export const dbTimestampSchema = z.preprocess((val) => {
  if (typeof val === "number" && !Number.isNaN(val)) {
    return new Date(val * 1000);
  } else if (typeof val === "string") {
    return new Date(val);
  }
  return new Date();
}, z.date());

export const cursorSchema = z
  .preprocess(
    (val) => {
      if (typeof val === "string") {
        const [sortVal, id] = val.split("|").map(Number);
        return { sortVal, id };
      }
      return val;
    },
    z
      .object({
        sortVal: z.number().int(),
        id: z.number().int(),
      })
      .nullish()
      .catch(null),
  )
  .nullish()
  .catch(null);
