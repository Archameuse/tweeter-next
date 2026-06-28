import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions(),
    tweets: r.many.tweets({
      from: r.users.user_id,
      to: r.tweets.user_id,
    }),
    likes: r.many.tweets({
      from: r.users.user_id.through(r.likes.user_id),
      to: r.tweets.tweet_id.through(r.likes.tweet_id),
    }),
    saves: r.many.tweets({
      from: r.users.user_id.through(r.saves.user_id),
      to: r.tweets.tweet_id.through(r.saves.tweet_id),
    }),
    retweets: r.many.tweets({
      from: r.users.user_id.through(r.retweets.user_id),
      to: r.tweets.tweet_id.through(r.retweets.tweet_id),
    }),
    following: r.many.users({
      from: r.users.user_id.through(r.follows.follower_id),
      to: r.users.user_id.through(r.follows.followed_id),
    }),
    followers: r.many.users({
      from: r.users.user_id.through(r.follows.followed_id),
      to: r.users.user_id.through(r.follows.follower_id),
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.user_id,
      to: r.users.user_id,
      optional: false,
    }),
  },
  tweets: {
    author: r.one.users({
      from: r.tweets.user_id,
      to: r.users.user_id,
      optional: false,
    }),
    hashtags: r.many.hashtags({
      from: r.tweets.tweet_id.through(r.tweets_hashtags.tweet_id),
      to: r.hashtags.hashtag_id.through(r.tweets_hashtags.hashtag_id),
    }),
    parent: r.one.tweets({
      from: r.tweets.reply_to,
      to: r.tweets.tweet_id,
      optional: true,
    }),
    likes: r.many.users({
      from: r.tweets.tweet_id.through(r.likes.tweet_id),
      to: r.users.user_id.through(r.likes.user_id),
    }),
    saves: r.many.users({
      from: r.tweets.tweet_id.through(r.saves.tweet_id),
      to: r.users.user_id.through(r.saves.user_id),
    }),
    retweets: r.many.users({
      from: r.tweets.tweet_id.through(r.retweets.tweet_id),
      to: r.users.user_id.through(r.retweets.user_id),
    }),
  },
  hashtags: {
    tweets: r.many.tweets(),
  },
}));

// export const relations = defineRelations(schema, (r) => ({
//   users: {
//     sessions: r.many.sessions(),
//     tweets: r.many.tweets(),
//     likes: r.many.likes(),
//     saves: r.many.saves(),
//     retweets: r.many.retweets(),
//     following: r.many.users({
//       from: r.users.user_id.through(r.follows.follower_id),
//       to: r.users.user_id.through(r.follows.followed_id),
//     }),
//     followers: r.many.users({
//       from: r.users.user_id.through(r.follows.followed_id),
//       to: r.users.user_id.through(r.follows.follower_id),
//     }),
//   },
//   sessions: {
//     user: r.one.users({
//       from: r.sessions.user_id,
//       to: r.users.user_id,
//       optional: false,
//     }),
//   },
//   tweets: {
//     author: r.one.users({
//       from: r.tweets.user_id,
//       to: r.users.user_id,
//       optional: false,
//     }),
//     hashtags: r.many.hashtags({
//       from: r.tweets.tweet_id.through(r.tweets_hashtags.tweet_id),
//       to: r.hashtags.hashtag_id.through(r.tweets_hashtags.hashtag_id),
//     }),
//     parent: r.one.tweets({
//       from: r.tweets.reply_to,
//       to: r.tweets.tweet_id,
//       optional: true,
//     }),
//     likes: r.many.users({
//       from: r.tweets.tweet_id.through(r.likes.tweet_id),
//       to: r.users.user_id.through(r.likes.user_id),
//     }),
//     saves: r.many.users({
//       from: r.tweets.tweet_id.through(r.saves.tweet_id),
//       to: r.users.user_id.through(r.saves.user_id),
//     }),
//     retweets: r.many.users({
//       from: r.tweets.tweet_id.through(r.retweets.tweet_id),
//       to: r.users.user_id.through(r.retweets.user_id),
//     }),
//   },
//   hashtags: {
//     tweets: r.many.tweets(),
//   },
// }));
