import z from "zod";

export const passwordSchema = z.string().trim();
//   .min(8, { error: "Password must be at least 8 characters long" })
//   .max(40, { error: "Password must be at most 40 characters long" })
//   .regex(/[A-Z]/, {
//     error: "Password must contain at least one uppercase character",
//   })
//   .regex(/[a-z]/, {
//     error: "Password must contain at least one lowercase character",
//   })
//   .regex(/[0-9]/, { error: "Password must contain at least one number" });
//maybe something else

export const emailSchema = z
  .string()
  .trim()
  .regex(/^[\S]+@[\S]+$/, {
    error: "Email must contain at least one character before and after @",
  });

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
