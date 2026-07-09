import {
  countSchema,
  hashtagSchema,
  idNumberSchema,
  idSchema,
  imageLinkSchema,
  looseIdSchema,
  looseUsernameSchema,
  optionalBooleanSchema,
} from "@/schema.js";
import { paginationQuerySchema } from "@/utils/drizzleHandlers.js";
import z from "zod";

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
  tweet_id: looseIdSchema,
  content: z.string(),
  image: imageLinkSchema.nullish().catch(null),
  created_at: z.preprocess((val) => {
    if (typeof val === "number" && !Number.isNaN(val)) {
      return new Date(val * 1000);
    } else if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  }, z.date()),
  only_followers: optionalBooleanSchema,
  author: z.object({
    user_id: looseIdSchema,
    username: looseUsernameSchema,
    avatar: imageLinkSchema.nullish().catch(null),
    is_followed: optionalBooleanSchema,
  }),
  reply_to: looseIdSchema.nullish(),
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
        tweet_id: looseIdSchema,
        username: looseUsernameSchema,
      })
      .nullish(),
  ),
  likes_count: countSchema,
  saves_count: countSchema,
  retweets_count: countSchema,
  replies_count: countSchema,
  retweeted_by: looseUsernameSchema.nullish(),
  hashtag: hashtagSchema.nullish().catch(null),
  is_liked: optionalBooleanSchema,
  is_saved: optionalBooleanSchema,
  is_retweeted: optionalBooleanSchema,
  reply_allowed: optionalBooleanSchema,
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
    replyTo: idNumberSchema.nullish(),
    content: z.string().trim().min(1),
    hashtag: hashtagSchema.nullish(),
    onlyFollowers: optionalBooleanSchema,
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
    replyAllowed: db.reply_allowed,
  }),
);

export const tweetPaginationQuerySchema = paginationQuerySchema
  .partial()
  .extend({
    orderBy: z.preprocess((val) => val, z.enum(ORDER)).catch(ORDER.new),
  });

export const filterQuerySchema = z.object({
  //   filter: z.preprocess((val) => val, z.enum(FILTER)).catch(FILTER.all),
  activeFilters: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          return val.toLowerCase();
        }
        return val;
      },
      z.set(z.enum(FILTER)),
    )
    .catch(new Set([FILTER.all])),
  search: z.string().trim().toLowerCase().catch(""),
  profileId: idNumberSchema.optional(),
  // profileId: z.coerce.number().int().positive().optional(),
  isRetweet: optionalBooleanSchema,
  tweetId: idNumberSchema.optional(),
});

export const dbTrendsSchema = z.object({
  hashtag_id: idSchema,
  hashtag: hashtagSchema,
  tweets_count: countSchema,
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
  tweetId: idNumberSchema,
  userId: idNumberSchema,
  action: z.enum(ACTION),
});

export type DbTweetType = z.infer<typeof dbTweetSchema>;
export type TweetPaginationInput = z.input<typeof tweetPaginationQuerySchema>;
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
