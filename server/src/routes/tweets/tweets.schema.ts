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

export const dbTweetSchema = z.object({
  tweet_id: z.number(),
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
    user_id: z.number(),
    username: z.string(),
    avatar: z.string().nullable().optional(),
    is_followed: z.coerce.boolean(),
  }),
  reply_to: z.number().nullable().optional(),
  reply_to_author: z.preprocess(
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

export const dbTweetToGlobalTweetSchema = dbTweetSchema
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
      replyTo: db.reply_to_author
        ? {
            id: db.reply_to_author.tweet_id,
            username: db.reply_to_author.username,
          }
        : null,
      retweetedBy: db.retweeted_by,
    }),
  )
  .array();

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
  profileId: z.coerce.number().int().positive().optional(),
  isRetweet: z.coerce.boolean().catch(false),
  tweetId: z.coerce.number().int().positive().optional(),
});

export const dbTrendsSchema = z.object({
  hashtag_id: z.number(),
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

export type PaginationInput = z.input<typeof paginationQuerySchema>;
export type FilterInput = z.input<typeof filterQuerySchema>;
