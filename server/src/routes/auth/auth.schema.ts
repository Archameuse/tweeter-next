import { emailSchema, passwordSchema, usernameSchema } from "#/schema.js";
import z from "zod";

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
}) satisfies z.ZodType<UserCreateInput>;

export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
}) satisfies z.ZodType<UserLoginInput>;

export const deleteUserSchema = z.object({
  password: passwordSchema,
});

// not sure if I need to preprocess?
// export const createUserSchema = z.preprocess(
//   (val) => {
//     if (typeof val === "string")
//       try {
//         console.log(JSON.parse(val));
//         return JSON.parse(val);
//       } catch {
//         return val;
//       }
//     return val;
//   },
//   z.object({
//     email: emailSchema,
//     password: passwordSchema,
//     username: usernameSchema,
//   }) satisfies z.ZodType<UserCreateInput>,
// );

// export const loginUserSchema = z.preprocess(
//   (val) => {
//     if (typeof val === "string")
//       try {
//         return JSON.parse(val);
//       } catch {
//         return val;
//       }
//     return val;
//   },
//   z.object({
//     email: emailSchema,
//     password: passwordSchema,
//   }) satisfies z.ZodType<UserLoginInput>,
// );
