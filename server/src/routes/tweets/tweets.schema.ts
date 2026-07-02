import { idNumberSchema, idSchema } from "@/schema.js";
import z from "zod";

const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 25;
const MIN_PAGE_LIMIT = 1;

export enum FILTER {
  all = "all",
  media = "media",
  likes = "likes",
  profileTweets = "tweets",
  profileReplies = "replies",
  profileTweetsFollowed = "followedTweets",
  tweetReplies = "tweet-replies",
}

export enum ORDER {
  top = "top", //by likes desc
  new = "latest", // by created_at desc
  old = "old", //by created_at asc
}

export enum ACTION {
  like,
  retweet,
  save,
}
/**
 * Schema for validating response from database
 */
export const dbTweetSchema = z.object({
  tweet_id: idSchema,
  content: z.string(),
  image: z.string().nullable().optional(),
  created_at: z.preprocess((val) => {
    if (typeof val === "number" && !Number.isNaN(val)) {
      return new Date(val * 1000);
    } else if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }, z.date()),
  only_followers: z.coerce.boolean(),
  author: z.object({
    user_id: idSchema,
    username: z.string(),
    avatar: z.string().nullable().optional(),
    is_followed: z.coerce.boolean().optional(),
  }),
  reply_to: idSchema.nullable().optional(),
  reply_to_author: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      } else return val;
    },
    z
      .object({
        tweet_id: idSchema,
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
  is_liked: z.coerce.boolean().optional(),
  is_saved: z.coerce.boolean().optional(),
  is_retweeted: z.coerce.boolean().optional(),
});

/**
 * Schema for validating TweetInput + parsing it for db insert hence we need author id in Number here
 */
export const globalTweetSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  },
  z.object({
    replyTo: idSchema
      .transform(Number)
      .pipe(z.number().positive().int())
      .nullish(),
    content: z.string().trim().min(1),
    hashtag: z
      .string()
      .trim()
      .max(64)
      .regex(/^[a-zA-Z]+[a-zA-Z0-9]*$/, {
        error:
          "Hashtag string must start with at least 1 letter and contain only latin letters and numbers",
      })
      .nullish(),
    onlyFollowers: z.coerce.boolean().optional(),
  }) satisfies z.ZodType<TweetInput>,
);

/**
 * Schema for parsing TweetInput to actual tweet insert schema
 */
export const globalTweetToDbTweetSchema = (userId: number | string) =>
  globalTweetSchema.transform((tweet) => ({
    user_id: idNumberSchema.parse(userId),
    content: tweet.content,
    only_followers: tweet.onlyFollowers,
    reply_to: tweet.replyTo,
    image: z.string().nullish().parse(null),
  }));

/**
 * Schema for parsing db response to
 */
export const dbTweetToGlobalTweetSchema = dbTweetSchema.transform(
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
    replyTo: db.reply_to_author
      ? {
          id: db.reply_to_author.tweet_id,
          username: db.reply_to_author.username,
        }
      : null,
    retweetedBy: db.retweeted_by,
  }),
);

export const paginationQuerySchema = z.object({
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
export const filterQuerySchema = z.object({
  //   filter: z.preprocess((val) => val, z.enum(FILTER)).catch(FILTER.all),
  activeFilters: z
    .preprocess((val) => val, z.set(z.enum(FILTER)))
    .catch(new Set([FILTER.all])),
  search: z.string().trim().toLowerCase().catch(""),
  profileId: idSchema.transform(Number).pipe(z.number().positive()).optional(),
  // profileId: z.coerce.number().int().positive().optional(),
  isRetweet: z.coerce.boolean().catch(false),
  tweetId: z.coerce.number().int().positive().optional(),
});

export const dbTrendsSchema = z.object({
  hashtag_id: idSchema,
  hashtag: z.string(),
  tweets_count: z.number(),
});

export const dbTrendsToGlobalTrendsSchema = dbTrendsSchema
  .transform(
    (db): Trend => ({
      id: db.hashtag_id,
      hashtag: db.hashtag,
      tweets: db.tweets_count,
    }),
  )
  .array();

export const tweetExistsAndActionQuerySchema = z.object({
  tweetId: z.coerce.number().min(1).int(),
  userId: z.coerce.number().min(1).int(),
  action: z.enum(ACTION),
});

export type DbTweetType = z.infer<typeof dbTweetSchema>;
export type PaginationInput = z.input<typeof paginationQuerySchema>;
export type FilterInput = z.input<typeof filterQuerySchema>;
export type TweetExistsAndActionInput = z.input<
  typeof tweetExistsAndActionQuerySchema
>;

// export const globalTweetSchema = z.object({
//   id: idSchema.optional(), //for
//   author: z.object({
//     id: idSchema.transform(Number).pipe(z.number().positive().int()),
//     username: z.string(),
//     avatar: z.string().nullish(),
//     followed: z.coerce.boolean(),
//   }),
//   content: z.string(),
//   created_at: z.date().catch(() => new Date()),
//   likes: z.number().catch(0),
//   replies: z.number().catch(0),
//   retweets: z.number().catch(0),
//   saves: z.number().catch(0),
//   liked: z.coerce.boolean(),
//   saved: z.coerce.boolean(),
//   retweeted: z.coerce.boolean(),
//   onlyFollowers: z.coerce.boolean(),
//   hashtag: z.string().optional(),
//   image: z.string().optional(),
//   retweetedBy: z.string().optional(),
//   replyTo: z
//     .object({
//       id: idSchema,
//       username: z.string(),
//     })
//     .optional(),
// });

// export const globalTweetSchema = z.object({
//   authorId: idSchema.transform(Number).pipe(z.number().positive().int()),
//   replyTo: idSchema
//     .transform(Number)
//     .pipe(z.number().positive().int())
//     .nullish(),
//   content: z.string().trim().min(1),
//   hashtag: z.string().min(1).max(64).nullish(),
//   image: z.string().nullish(),
//   onlyFollowers: z.coerce.boolean(),
// }) satisfies z.ZodType<TweetInput>;
