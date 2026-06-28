import { db } from "@/db/index.js";
import {
  follows,
  hashtags,
  likes,
  retweets,
  saves,
  tweets,
  tweets_hashtags,
  users,
} from "@/db/schema.js";
import {
  and,
  asc,
  count,
  desc,
  eq,
  isNotNull,
  SelectedFields,
  sql,
} from "drizzle-orm";
import { alias, SQLiteSelect, union } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

const app = new Hono();

const userId = 1; //i would need to somehow get user id from session or something

// top,  <- explore\bookmarks
// latest, <- explore\bookmarks
// media, <- all have
// tweets, <- profile | only tweets of this user
// tweets&replies, <- profile | tweets of this user + replies to him
// likes <- profile | only tweets this user liked
enum FILTER {
  media = "media",
  likes = "likes",
  tweets = "tweets",
  tweetsAndReplies = "tweetsAndReplies",
}

enum ORDER {
  top = "top", //by likes desc
  new = "latest", // by created_at desc
  old = "old", //by created_at asc
}

const DEFAULT_PAGE_LIMIT = 15;
const MAX_PAGE_LIMIT = 25;
const MIN_PAGE_LIMIT = 1;

const dbTweetSchema = z.object({
  tweet_id: z.number(),
  content: z.string(),
  image: z.string().nullable().optional(),
  created_at: z.coerce.date(),
  only_followers: z.coerce.boolean(),
  author: z.object({
    user_id: z.number(),
    username: z.string(),
    avatar: z.string().nullable().optional(),
    is_followed: z.coerce.boolean(),
  }),
  reply_to: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      } else return null;
    },
    z
      .object({
        tweet_id: z.number(),
        username: z.string(),
      })
      .nullable()
      .optional(),
  ),

  likes_count: z.coerce.number().default(0),
  saves_count: z.coerce.number().default(0),
  retweets_count: z.coerce.number().default(0),
  replies_count: z.coerce.number().default(0),
  retweeted_by: z.string().nullable().optional(),
  hashtag: z.string().nullable().optional(),
  is_liked: z.coerce.boolean(),
  is_saved: z.coerce.boolean(),
  is_retweeted: z.coerce.boolean(),
});

const dbTweetToGlobalTweetSchema = dbTweetSchema
  .transform(
    (db): Tweet => ({
      id: db.tweet_id,
      author: {
        id: db.author.user_id,
        username: db.author.username,
        avatar: db.author.avatar,
        followed: db.author.is_followed,
      },
      content: db.content,
      created_at: db.created_at,
      likes: db.likes_count,
      replies: db.replies_count,
      retweets: db.retweets_count,
      saves: db.saves_count,
      hashtag: db.hashtag,
      image: db.image,
      liked: db.is_liked,
      saved: db.is_saved,
      retweeted: db.is_retweeted,
      onlyFollowers: db.only_followers,
      replyTo: db.reply_to
        ? {
            id: db.reply_to.tweet_id,
            username: db.reply_to.username,
          }
        : null,
      retweetedBy: db.retweeted_by,
    }),
  )
  .array();

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().min(1).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .positive()
    .min(MIN_PAGE_LIMIT)
    .max(MAX_PAGE_LIMIT)
    .catch(DEFAULT_PAGE_LIMIT),
  // orderBy: z.enum(ORDER).catch(ORDER.new),
  orderBy: z.preprocess((val) => val, z.enum(ORDER)).catch(ORDER.new),
});

type PaginationInput = z.input<typeof paginationQuerySchema>;

const buildTweetQuery = (fetchRetweets?: boolean) => {
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
      is_followed: userId
        ? sql<boolean>`EXISTS(SELECT 1 FROM ${follows} WHERE ${follows.follower_id} = ${userId} AND ${follows.followed_id} = ${tweets.user_id})`
        : sql<boolean>`FALSE`,
      avatar: users.avatar,
    },
    reply_to: sql<string | null>`
      CASE
        WHEN ${tweets.reply_to} IS NOT NULL
          THEN json_object(
            ${tweets.tweet_id.name}, ${parent.tweet_id},
            ${users.username.name}, ${parentAuthor.username}
          )
          ELSE NULL
      END
      `,
    is_liked: userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${likes} WHERE ${likes.tweet_id} = ${tweets.tweet_id} AND ${likes.user_id} = ${userId})`
      : sql<boolean>`FALSE`,
    is_retweeted: userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${retweets} WHERE ${retweets.tweet_id} = ${tweets.tweet_id} AND ${retweets.user_id} = ${userId})`
      : sql<boolean>`FALSE`,
    is_saved: userId
      ? sql<boolean>`EXISTS(SELECT 1 FROM ${saves} WHERE ${saves.tweet_id} = ${tweets.tweet_id} AND ${saves.user_id} = ${userId})`
      : sql<boolean>`FALSE`,
    likes_count:
      sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.tweet_id} = ${tweets.tweet_id})`.as(
        "likes_count",
      ),
    retweets_count:
      sql<number>`(SELECT COUNT(*) FROM ${retweets} WHERE ${retweets.tweet_id} = ${tweets.tweet_id})`.as(
        "retweets_count",
      ),
    saves_count:
      sql<number>`(SELECT COUNT(*) FROM ${saves} WHERE ${saves.tweet_id} = ${tweets.tweet_id})`.as(
        "saves_count",
      ),
    replies_count:
      sql<number>`(SELECT COUNT(*) FROM ${tweets} ${replyCounter} WHERE ${replyCounter.reply_to} = ${tweets.tweet_id})`.as(
        "replies_count",
      ),
    // likes_count: tweets.likes_count,
    // retweets_count: tweets.retweets_count,
    // saves_count: tweets.saves_count,
    // replies_count: tweets.replies_count,
    hashtag: sql<any>`(
            SELECT (${hashtags.hashtag}) 
            FROM ${tweets_hashtags} 
            LEFT JOIN ${hashtags} 
            USING(${sql.identifier(hashtags.hashtag_id.name)})
            WHERE ${tweets_hashtags.tweet_id} = ${tweets.tweet_id}
            ORDER BY ${tweets_hashtags.created_at} DESC
            LIMIT 1
          )`,
    retweeted_by: sql<string | null>`NULL`,
    created_at: sql<Date>`${tweets.created_at}`,
  };
  if (fetchRetweets)
    return db
      .select({
        ...sharedSelect,
        created_at: sql<Date>`${retweets.created_at}`,
        retweeted_by: sql<string | null>`${retweetedBy.username}`,
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

const pagination = <T extends SQLiteSelect>(
  db: T,
  query: Partial<PaginationInput> = {},
) => {
  const { page, perPage, orderBy } = paginationQuerySchema.parse(query);
  return db
    .orderBy(
      orderBy === ORDER.top
        ? desc(tweets.likes_count)
        : orderBy === ORDER.old
          ? asc(tweets.created_at)
          : desc(tweets.created_at),
    )
    .limit(perPage)
    .offset((page - 1) * perPage);
};

const filters = <T extends SQLiteSelect>(db: T) => {};

// saved on /bookmarks + filters
app.get("/bookmarks", async (c) => {
  const { page, filter, limit } = c.req.query();
  const start = performance.now();
  const data: Tweet[] = dbTweetToGlobalTweetSchema.parse(
    await pagination(
      buildTweetQuery().innerJoin(
        saves,
        and(eq(tweets.tweet_id, saves.tweet_id), eq(saves.user_id, userId)),
      ),
      { page, perPage: limit },
    ),
  );
  const end = performance.now();
  // console.log(`Execution time ${(end - start).toFixed(2)} ms`);
  return c.json(data);
});

app.get("/", async (c) => {
  const { page, filter, limit } = c.req.query();
  const data = dbTweetToGlobalTweetSchema.parse(
    await pagination(buildTweetQuery(), { page: 1, orderBy: filter }),
  );
  return c.json(data);
});

// all w/o retweets on /explore (replies shown as normal tweets but with some marking that they are replies in fact) + filters+search

// home on / own tweets+retweets + follows tweets and retweets + filters

// profile on /user/:id users tweets+retweets + filters

// replies /replies/:id list of tweets that are replying to this specific id open through modal

// trends /trends top5 hashtags with most tweets for now, maybe later will add some logic
export default app;
