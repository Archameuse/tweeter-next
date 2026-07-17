import { db } from "#/db/index.js";
import {
  follows,
  hashtags,
  likes,
  retweets,
  saves,
  tweets,
  tweets_hashtags,
  users,
} from "#/db/schema.js";
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNotNull,
  like,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias, SQLiteSelect, union } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { z } from "zod";
import {
  dbTrendsToGlobalTrendsSchema,
  dbTweetToGlobalTweetSchema,
  FILTER,
  FilterInput,
  filterQuerySchema,
  ORDER,
  TweetPaginationInput,
  tweetPaginationQuerySchema,
} from "./tweets.schema.js";
import { idNumberSchema, idSchema } from "#/schema.js";
import { MissingIdError } from "#/utils/standardErrors.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "#/middleware/auth.middleware.js";
import { paginate } from "#/utils/drizzleHandlers.js";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

/**
 * REPLACE *_count fields with respective direct fetch for optimization once requests become to big
 * REPLACE back if need for testing purposes, current pagination doesn't utilize them
 */
const buildTweetQuery = (
  userId?: z.infer<typeof idNumberSchema>,
  fetchRetweets?: boolean,
) => {
  const parent = alias(tweets, "reply_to");
  const parentAuthor = alias(users, "reply_to_author");
  const replyCounter = alias(tweets, "reply_counter");
  const retweetedBy = alias(users, "retweeted_by");
  const sharedSelect = {
    tweet_id: tweets.tweet_id,
    content: tweets.content,
    image: tweets.image,
    // created_at: tweets.created_at,
    only_followers: tweets.only_followers,
    author: {
      user_id: users.user_id,
      username: users.username,
      is_followed: (userId
        ? sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.follower_id} = ${userId} AND ${follows.followed_id} = ${tweets.user_id})`
        : sql<boolean>`FALSE`
      ).as("is_followed"),
      avatar: users.avatar,
    },
    reply_to: tweets.reply_to,
    reply_to_author: sql<string | null>`
      CASE
        WHEN ${tweets.reply_to} IS NOT NULL
          THEN json_object(
            ${tweets.tweet_id.name}, ${parent.tweet_id},
            ${users.username.name}, ${parentAuthor.username}
          )
          ELSE NULL
      END
      `.as("reply_to_author"),
    is_liked: (userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${likes} WHERE ${likes.tweet_id} = ${tweets.tweet_id} AND ${likes.user_id} = ${userId})`
      : sql<boolean>`FALSE`
    ).as("is_liked"),
    is_retweeted: (userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${retweets} WHERE ${retweets.tweet_id} = ${tweets.tweet_id} AND ${retweets.user_id} = ${userId})`
      : sql<boolean>`FALSE`
    ).as("is_retweeted"),
    is_saved: (userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${saves} WHERE ${saves.tweet_id} = ${tweets.tweet_id} AND ${saves.user_id} = ${userId})`
      : sql<boolean>`FALSE`
    ).as("is_saved"),
    // likes_count:
    //   sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.tweet_id} = ${tweets.tweet_id})`.as(
    //     "likes_count",
    //   ),
    // retweets_count:
    //   sql<number>`(SELECT COUNT(*) FROM ${retweets} WHERE ${retweets.tweet_id} = ${tweets.tweet_id})`.as(
    //     "retweets_count",
    //   ),
    // saves_count:
    //   sql<number>`(SELECT COUNT(*) FROM ${saves} WHERE ${saves.tweet_id} = ${tweets.tweet_id})`.as(
    //     "saves_count",
    //   ),
    // replies_count:
    //   sql<number>`(SELECT COUNT(*) FROM ${tweets} AS ${replyCounter} WHERE ${replyCounter.reply_to} = ${tweets.tweet_id})`.as(
    //     "replies_count",
    //   ),
    likes_count: tweets.likes_count.as("likes_count"),
    retweets_count: tweets.retweets_count.as("retweets_count"),
    saves_count: tweets.saves_count.as("saves_count"),
    replies_count: tweets.replies_count.as("replies_count"),
    hashtag: sql<any>`(
            SELECT (${hashtags.hashtag}) 
            FROM ${tweets_hashtags} 
            LEFT JOIN ${hashtags} 
            USING(${sql.identifier(hashtags.hashtag_id.name)})
            WHERE ${tweets_hashtags.tweet_id} = ${tweets.tweet_id}
            ORDER BY ${tweets_hashtags.created_at} DESC
            LIMIT 1
          )`.as("hashtag"),
    retweeted_by: sql<string | null>`NULL`.as("retweeted_by"),
    reply_allowed: (userId
      ? sql<boolean>`NOT ${tweets.only_followers} OR ${tweets.user_id} = ${userId} OR EXISTS (SELECT 1 FROM ${follows} WHERE ${follows.followed_id} = ${userId} AND ${follows.follower_id} = ${tweets.user_id})`
      : sql<boolean>`FALSE`
    ).as("reply_allowed"),
    created_at: sql<Date>`${tweets.created_at}`.as("created_at"),
  };
  if (fetchRetweets)
    return db
      .select({
        ...sharedSelect,
        created_at: sql<Date>`${retweets.created_at}`.as("created_at"),
        retweeted_by: sql<string | null>`${retweetedBy.username}`.as(
          "retweeted_by",
        ),
      })
      .from(retweets)
      .innerJoin(tweets, eq(retweets.tweet_id, tweets.tweet_id))
      .innerJoin(retweetedBy, eq(retweets.user_id, retweetedBy.user_id))
      .innerJoin(users, eq(tweets.user_id, users.user_id)) // retweeted tweets author
      .leftJoin(parent, eq(parent.tweet_id, tweets.reply_to))
      .leftJoin(parentAuthor, eq(parentAuthor.user_id, parent.user_id))
      .$dynamic();
  return db
    .select(sharedSelect)
    .from(tweets)
    .innerJoin(users, eq(tweets.user_id, users.user_id))
    .leftJoin(parent, eq(parent.tweet_id, tweets.reply_to))
    .leftJoin(parentAuthor, eq(parentAuthor.user_id, parent.user_id))
    .$dynamic();
};

/** should be used only with buildTweetQuery
 * @param query We only need to pass perPage, orderBy and cursor
 */
const pagination = <T extends SQLiteSelect>(
  selection: T,
  query: Partial<TweetPaginationInput> = {},
) => {
  const { perPage, orderBy, cursor } = tweetPaginationQuerySchema.parse(query);
  const orderSQ = selection.as("order_sq");
  const orderedSelection = db
    .select()
    .from(orderSQ)
    .orderBy(
      orderBy === ORDER.top
        ? desc(sql`likes_count`)
        : orderBy === ORDER.old
          ? asc(sql`created_at`)
          : desc(sql`created_at`),
      orderBy === ORDER.old ? asc(sql`tweet_id`) : desc(sql`tweet_id`),
    )
    .$dynamic();
  return paginate(orderedSelection, {
    cursor,
    idColName: tweets.tweet_id.name,
    sortColName:
      orderBy === ORDER.top ? tweets.likes_count.name : tweets.created_at.name,
    perPage,
    isAsc: orderBy === ORDER.old,
  });
};

/** should be used only with buildTweetQuery */
const filters = <T extends SQLiteSelect>(
  db: T,
  query: Partial<FilterInput> = {},
) => {
  const { activeFilters, search, profileId, isRetweet, tweetId } =
    filterQuerySchema.parse(query);
  const escapedSearch = z
    .string()
    .transform((val) => val.replace(/[%_]/g, "\\$&"))
    .parse(search);
  const parent = alias(tweets, "reply_to");
  const followed = alias(users, "followed_user");
  return db
    .where(
      and(
        like(tweets.content, `%${escapedSearch}%`), //search filter
        activeFilters.has(FILTER.media) //media filter
          ? and(isNotNull(tweets.image), ne(tweets.image, ""))
          : sql`TRUE`,
        activeFilters.has(FILTER.likes) && profileId
          ? sql`
        EXISTS (
          SELECT 1 
          FROM ${likes} 
          WHERE ${likes.tweet_id} = ${tweets.tweet_id} 
          AND ${likes.user_id} = ${profileId})
      `
          : sql`TRUE`, //is profileId user liked this tweet filter
        activeFilters.has(FILTER.profileTweets) && profileId // profileId user own tweets or retweets
          ? or(
              isRetweet
                ? eq(retweets.user_id, profileId)
                : or(
                    eq(tweets.user_id, profileId),
                    activeFilters.has(FILTER.profileReplies)
                      ? and(
                          eq(parent.tweet_id, tweets.reply_to),
                          eq(parent.user_id, profileId),
                        )
                      : sql`FALSE`,
                  ),
              activeFilters.has(FILTER.profileTweetsFollowed)
                ? sql`
                  EXISTS (
                  SELECT 1
                  FROM ${follows}
                  INNER JOIN ${users} AS ${followed}
                  ON ${follows.followed_id} = ${followed.user_id}
                  WHERE ${follows.follower_id} = ${profileId}
                  AND ${!isRetweet ? tweets.user_id : retweets.user_id} = ${followed.user_id}
                )`
                : sql`FALSE`,
            )
          : sql`TRUE`,
        activeFilters.has(FILTER.tweetReplies) && tweetId
          ? isRetweet
            ? sql`FALSE`
            : eq(tweets.reply_to, tweetId)
          : sql`TRUE`,
      ),
    )
    .$dynamic();
};

// saved on /bookmarks + filters
app.get("/bookmarks", authMiddleware, async (c) => {
  const { cursor, scope, limit } = c.req.query();
  const userId = c.get("userId");
  const { data: rawData, ...metadata } = await pagination(
    filters(
      buildTweetQuery(userId).innerJoin(
        saves,
        and(eq(tweets.tweet_id, saves.tweet_id), eq(saves.user_id, userId)),
      ),
      { activeFilters: new Set([scope]) },
    ),
    { perPage: limit, orderBy: scope, cursor },
  );
  const data: Tweet[] = dbTweetToGlobalTweetSchema.array().parse(rawData);
  return c.json({ data, ...metadata });
});

// all w/o retweets on /explore (replies shown as normal tweets but with some marking that they are replies in fact) + filters+search
app.get("/explore", optionalAuthMiddleware, async (c) => {
  const { cursor, scope, limit, q } = c.req.query();
  const userId = c.get("userId");
  const { data: rawData, ...metadata } = await pagination(
    filters(buildTweetQuery(userId), {
      activeFilters: new Set([scope]),
      search: q,
    }),
    {
      cursor,
      perPage: limit,
      orderBy: scope,
    },
  );
  const data = dbTweetToGlobalTweetSchema.array().parse(rawData);
  return c.json({ data, ...metadata });
});

// profile on /user/:id and / users tweets+retweets + filters
app.get("/user", optionalAuthMiddleware, async (c) => {
  const { cursor, scope, limit, id } = c.req.query();
  const userId = c.get("userId");
  const processedScope = z
    .preprocess(
      (val) => val,
      z.enum([
        FILTER.profileTweets,
        FILTER.profileReplies,
        FILTER.media,
        FILTER.likes,
      ]),
    )
    .catch(FILTER.profileTweets)
    .parse(scope);
  const processedId = z
    .preprocess((val) => val ?? userId, idNumberSchema.optional())
    .parse(id);
  if (!processedId)
    throw new HTTPException(400, {
      message:
        "You need to be either authenticated to view home feed or pass profile id as ?id",
    });
  // if no id passed in query then fallback to current logged in user or crash

  // const activeFilters = new Set([
  //   FILTER.profileTweets,
  //   FILTER.profileTweetsFollowed,
  // ]);

  // if (processedScope) activeFilters.add(processedScope);
  const activeFilters =
    processedScope !== FILTER.likes
      ? new Set([
          FILTER.profileTweets,
          FILTER.profileTweetsFollowed,
          processedScope,
        ])
      : new Set([processedScope]);

  const { data: rawData, ...metadata } = await pagination(
    activeFilters.has(FILTER.profileReplies)
      ? filters(buildTweetQuery(userId, false), {
          profileId: processedId,
          activeFilters,
          isRetweet: false,
        })
      : union(
          filters(buildTweetQuery(userId, false), {
            profileId: processedId,
            activeFilters,
            isRetweet: false,
          }),
          filters(buildTweetQuery(userId, true), {
            profileId: processedId,
            activeFilters,
            isRetweet: true,
          }),
        ).$dynamic(),
    { cursor, perPage: limit, orderBy: ORDER.new },
  );
  const data = dbTweetToGlobalTweetSchema.array().parse(rawData);
  return c.json({ data, ...metadata });
});

// replies /replies/:id list of tweets that are replying to this specific id open through modal
app.get("/replies", optionalAuthMiddleware, async (c) => {
  const { id, cursor, limit } = c.req.query();
  if (!id) throw new MissingIdError();
  const processedId = idSchema.parse(id);
  const userId = c.get("userId");
  const { data: rawData, ...metadata } = await pagination(
    filters(buildTweetQuery(userId), {
      tweetId: processedId,
      activeFilters: new Set([FILTER.tweetReplies]),
    }),
    {
      perPage: limit,
      cursor,
      orderBy: ORDER.new,
    },
  );
  const data = dbTweetToGlobalTweetSchema.array().parse(rawData);
  return c.json({ data, ...metadata });
});

// trends /trends top5 hashtags with most tweets for now, maybe later will add some logic
app.get("/trends", async (c) => {
  // const tweetsCounter = alias(tweets_hashtags, "tweets_counter");
  const data = dbTrendsToGlobalTrendsSchema.parse(
    await db
      .select({
        hashtag_id: hashtags.hashtag_id,
        hashtag: hashtags.hashtag,
        tweets_count: count(tweets_hashtags.hashtag_id).as("tweets_count"),
        // tweets_counts: hashtags.tweets_count <- for scaling
      })
      .from(hashtags)
      .leftJoin(
        tweets_hashtags,
        eq(hashtags.hashtag_id, tweets_hashtags.hashtag_id),
      )
      .groupBy(hashtags.hashtag_id, hashtags.hashtag)
      .orderBy(desc(sql`tweets_count`))
      .limit(5),
  );
  return c.json(data);
});
export default app;
