import { idNumberSchema } from "@/schema.js";
import { UnauthenticatedError } from "@/utils/standardErrors.js";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

const mockUserId = 1;

// follow/:id -> post -> follow to specific user
app.post("/follow/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const processedAuthId = idNumberSchema.nullish().parse(mockUserId);
  const processedTargetId = idNumberSchema.parse(id);
  if (!processedAuthId) throw new UnauthenticatedError();
});
// follow/:id -> delete -> unfollow from specific user
// settings/:id -> post? -> update settings of specific user

// all of this is basically session stuff i would need to figure out how to work with sessions first
// also would need to create some feed get requests for session probably
// or just push session to a different route
// create -> post -> create new user, #session handling
// signIn -> post -> get password of user by email from db, compare password hash, #session handling
// signOut -> post -> #session handling
// refresh? -> post -> #session handling

export default app;
