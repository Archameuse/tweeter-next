import z from "zod";

const MAX_SIZE = 20;

export const imageSchema = z.preprocess(
  (val) => (val instanceof File && val.size === 0 ? null : val),
  z
    .file({ error: `Image should be a file` })
    .min(50, { error: `Min size - 50 bytes` })
    .max(MAX_SIZE * 1024 * 1024, { error: `Max size - ${MAX_SIZE} mb` })
    .mime(["image/jpeg", "image/png", "image/webp", "image/gif"]) //remove gif eventually
    .optional()
    .nullable(),
);

export const idSchema = z.coerce
  .string()
  .trim()
  .regex(/^\d+$/, { error: "Id must contain only and at least 1 digits" });

export const idNumberSchema = idSchema
  .transform(Number)
  .pipe(z.number().min(1).int());
