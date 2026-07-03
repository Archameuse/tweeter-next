import { emailSchema, passwordSchema, usernameSchema } from "@/schema.js";
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
