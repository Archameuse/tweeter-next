import { db } from "@/db/index.js";
import { follows, users } from "@/db/schema.js";
import {
  dbUserToGlobalUserSchema,
  idNumberSchema,
  idSchema,
} from "@/schema.js";
import { desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";
import {
  dbProfileToGlobalProfileSchema,
  dbUserSettingsToGlobalUserSettingsSchema,
  FOLLOW_SCOPE,
  USER_SCOPE,
} from "./users.schema.js";
import { MissingIdError } from "@/utils/standardErrors.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "@/middleware/auth.middleware.js";

const app = new Hono();

const MIN_PAGE_LIMIT = 5;
const MAX_PAGE_LIMIT = 15;
const DEFAULT_PAGE_LIMIT = 10;

// /exists -> does user with specific id exists, don't think I need it with current setup
// but still will keep in comments just in case if I missed something
// app.get("/exists", async (c) => {
//   const { id } = c.req.query();
//   if (!id) throw new MissingIdError();
//   const processedId = idNumberSchema.parse(id);
//   const data = await db.query.users.findFirst({
//     columns: {},
//     where: { user_id: processedId },
//   });
//   return c.json({ exists: !!data });
// });

// /follows scope=followers :id -> list of this user's followers
// /follows scope=follows  :id -> list of users this user is following
app.get("/follows", optionalAuthMiddleware, async (c) => {
  const { id, page, limit, scope } = c.req.query();
  if (!id) throw new MissingIdError();
  const authId = c.get("userId");
  const processedTargetId = idNumberSchema.parse(id);
  const processedPage = z.coerce.number().int().min(1).catch(1).parse(page);
  const processedLimit = z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_PAGE_LIMIT)
    .max(MAX_PAGE_LIMIT)
    .catch(DEFAULT_PAGE_LIMIT)
    .parse(limit);
  const processedScope = z
    .enum(FOLLOW_SCOPE)
    .catch(FOLLOW_SCOPE.followers)
    .parse(scope);

  const data = await db
    .select({
      user_id: users.user_id,
      username: users.username,
      avatar: users.avatar,
      banner: users.banner,
      status: users.status,
      followers_count:
        sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.followed_id} = ${users.user_id})`.as(
          "followers_count",
        ),
      following_count:
        sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.follower_id} = ${users.user_id})`.as(
          "following_count",
        ),
      ...(authId &&
        authId !== processedTargetId && {
          is_followed:
            sql<boolean>`EXISTS (SELECT 1 FROM ${follows} WHERE ${follows.followed_id} = ${users.user_id} AND ${follows.follower_id} = ${authId})`.as(
              "is_followed",
            ),
        }),
    })
    .from(users)
    .innerJoin(
      follows,
      processedScope === FOLLOW_SCOPE.followers
        ? eq(follows.follower_id, users.user_id)
        : eq(follows.followed_id, users.user_id),
    )
    .where(
      processedScope === FOLLOW_SCOPE.followers
        ? eq(follows.followed_id, processedTargetId)
        : eq(follows.follower_id, processedTargetId),
    )
    .orderBy(desc(follows.created_at))
    .limit(processedLimit)
    .offset((processedPage - 1) * processedLimit);
  return c.json(dbProfileToGlobalProfileSchema.array().parse(data));
});

// /popular -> top 5 users by followers, maybe some algo in future
app.get("/popular", optionalAuthMiddleware, async (c) => {
  const authId = c.get("userId");
  const followersCount =
    sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.followed_id} = ${users.user_id})`.as(
      "followers_count",
    );
  const followingCount =
    sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.follower_id} = ${users.user_id})`.as(
      "following_count",
    );
  const data = await db
    .select({
      user_id: users.user_id,
      avatar: users.avatar,
      username: users.username,
      banner: users.banner,
      status: users.status,
      followers_count: followersCount,
      following_count: followingCount,

      ...(authId && {
        is_followed:
          sql<boolean>`EXISTS (SELECT 1 FROM ${follows} WHERE ${follows.followed_id} = ${users.user_id} AND ${follows.follower_id} = ${authId})`.as(
            "is_followed",
          ),
      }),
    })
    .from(users)
    .orderBy(desc(followersCount), desc(users.created_at))
    .limit(5);
  return c.json(dbProfileToGlobalProfileSchema.array().parse(data));
});

// /settings -> get user's current settings basically almost the same as /profile maybe combine
// /profile -> specific users return profile data
// / -> get user by id
// combine them all with scope on /
/**
 * You either pass id or if you logged in it can fallback to your current id otherwise 404
 */
app.get("/", optionalAuthMiddleware, async (c) => {
  const { id, scope } = c.req.query();
  const authId = c.get("userId");
  const processedTargetId = idNumberSchema.nullish().parse(id) ?? authId;
  if (!processedTargetId)
    throw new HTTPException(400, {
      message: "Either pass id query or valid session",
    });
  const processedScope = z
    .preprocess((val) => val, z.enum(USER_SCOPE))
    .catch(USER_SCOPE.user)
    .parse(scope);
  const data = await db.query.users.findFirst({
    columns: {
      user_id: true,
      avatar: true,
      username: true,
      ...(processedScope !== USER_SCOPE.user && { banner: true, status: true }),
    },
    extras: {
      ...(authId &&
        authId !== processedTargetId && {
          is_followed:
            sql<boolean>`EXISTS (SELECT 1 FROM ${follows} WHERE ${follows.followed_id} = ${processedTargetId} AND ${follows.follower_id} = ${authId})`.as(
              "is_followed",
            ),
        }),
      ...(processedScope === USER_SCOPE.profile && {
        followers_count:
          sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.followed_id} = ${processedTargetId})`.as(
            "followers_count",
          ),
        following_count:
          sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.follower_id} = ${processedTargetId})`.as(
            "following_count",
          ),
      }),
    },
    where: {
      user_id: processedTargetId,
    },
  });
  if (!data)
    throw new HTTPException(404, {
      message: `Cant find ${processedScope} with user id of #${processedTargetId}`,
    });
  switch (processedScope) {
    case USER_SCOPE.user:
      return c.json(dbUserToGlobalUserSchema.parse(data));
    case USER_SCOPE.settings:
      return c.json(dbUserSettingsToGlobalUserSettingsSchema.parse(data));
    case USER_SCOPE.profile:
      return c.json(dbProfileToGlobalProfileSchema.parse(data));
    default:
      throw new HTTPException(404, {
        message: `Somehow unexpected scope passed through zod validator, please make sure to select one of following options: "${USER_SCOPE.user}", "${USER_SCOPE.settings}", "${USER_SCOPE.profile}".`,
      });
  }
});

// app.get("/", optionalAuthMiddleware, async (c) => {
//   const { id, scope } = c.req.query();
//   if (!id) throw new MissingIdError();
//   const authId = c.get('userId')
//   const processedTargetId = idNumberSchema.parse(id);
//   const processedScope = z
//     .preprocess((val) => val, z.enum(USER_SCOPE))
//     .catch(USER_SCOPE.user)
//     .parse(scope);
//   const data = await db.query.users.findFirst({
//     columns: {
//       user_id: true,
//       avatar: true,
//       username: true,
//       ...(processedScope !== USER_SCOPE.user && { banner: true, status: true }),
//     },
//     extras: {
//       ...(authId &&
//         authId !== processedTargetId && {
//           is_followed:
//             sql<boolean>`EXISTS (SELECT 1 FROM ${follows} WHERE ${follows.followed_id} = ${processedTargetId} AND ${follows.follower_id} = ${authId})`.as(
//               "is_followed",
//             ),
//         }),
//       ...(processedScope === USER_SCOPE.profile && {
//         followers_count:
//           sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.followed_id} = ${processedTargetId})`.as(
//             "followers_count",
//           ),
//         following_count:
//           sql<number>`(SELECT COUNT(*) FROM ${follows} WHERE ${follows.follower_id} = ${processedTargetId})`.as(
//             "following_count",
//           ),
//       }),
//     },
//     where: {
//       user_id: processedTargetId,
//     },
//   });
//   if (!data)
//     throw new HTTPException(404, {
//       message: `Cant find ${processedScope} with user id of #${processedTargetId}`,
//     });
//   switch (processedScope) {
//     case USER_SCOPE.user:
//       return c.json(dbUserToGlobalUserSchema.parse(data));
//     case USER_SCOPE.settings:
//       return c.json(dbUserSettingsSchema.parse(data));
//     case USER_SCOPE.profile:
//       return c.json(dbProfileToGlobalProfileSchema.parse(data));
//     default:
//       throw new HTTPException(404, {
//         message: `Somehow unexpected scope passed through zod validator, please make sure to select one of following options: "${USER_SCOPE.user}", "${USER_SCOPE.settings}", "${USER_SCOPE.profile}".`,
//       });
//   }
// });

export default app;
