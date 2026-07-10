import { db } from "@/db/index.js";
import {
  hashtags,
  likes,
  retweets,
  saves,
  tweets,
  tweets_hashtags,
} from "@/db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import z from "zod";
import {
  ACTION,
  dbTweetSchema,
  dbTweetToGlobalTweetSchema,
  globalTweetSchema,
  globalTweetToDbTweetSchema,
  TweetExistsAndActionInput,
  tweetExistsAndActionQuerySchema,
} from "./tweets.schema.js";
import { HTTPException } from "hono/http-exception";
import uploadImage from "@/utils/uploadImage.js";
import { idNumberSchema, imageSchema } from "@/schema.js";
import { ActionNoReturnError, Tweet404Error } from "@/utils/standardErrors.js";
import { authMiddleware } from "@/middleware/auth.middleware.js";

const app = new Hono();

/**
 * To be used only with transaction
 */
const tweetExistsAndActionQuery = (
  tx: SQLiteTransaction<"async", any, any>,
  query: TweetExistsAndActionInput,
) => {
  const { action, tweetId, userId } =
    tweetExistsAndActionQuerySchema.parse(query);
  return tx
    .select({
      isLiked:
        action === ACTION.like
          ? sql<boolean>`
        EXISTS (
          SELECT 1 
          FROM ${likes}
          WHERE ${likes.tweet_id} = ${tweetId}
          AND ${likes.user_id} = ${userId}
        )`
          : sql<boolean>`FALSE`,
      isRetweeted:
        action === ACTION.retweet
          ? sql<boolean>`
        EXISTS (
          SELECT 1
          FROM ${retweets}
          WHERE ${retweets.tweet_id} = ${tweetId}
          AND ${retweets.user_id} = ${userId}
        )
        `
          : sql<boolean>`FALSE`,
      isSaved:
        action === ACTION.save
          ? sql<boolean>`
        EXISTS(
          SELECT 1
          FROM ${saves}
          WHERE ${saves.tweet_id} = ${tweetId}
          AND ${saves.user_id} = ${userId}
        )`
          : sql<boolean>`FALSE`,
    })
    .from(tweets)
    .where(eq(tweets.tweet_id, tweetId));
};
// likes -> post
app.post("/likes/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.like,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(tweetId);
    }
    if (exists.isLiked) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is already liked by user #${userId}`,
      });
    }
    await tx.insert(likes).values({
      user_id: userId,
      tweet_id: tweetId,
    });
    const [newLikesAmount] = await tx
      .update(tweets)
      .set({
        likes_count: sql<number>`${tweets.likes_count} + 1`,
      })
      .where(eq(tweets.tweet_id, tweetId))
      .returning({ newLikesAmount: tweets.likes_count });
    if (!newLikesAmount) throw new ActionNoReturnError("Like insertion");
    return newLikesAmount;
  });
  // No location because my post requests anyway don't lead anywhere
  return c.json(resp, 201);
});

// likes -> delete
app.delete("/likes/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.like,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(tweetId);
    }
    if (!exists.isLiked) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not liked by user #${userId}`,
      });
    }
    await tx
      .delete(likes)
      .where(and(eq(likes.tweet_id, tweetId), eq(likes.user_id, userId)));
    const [newLikesAmount] = await tx
      .update(tweets)
      .set({
        likes_count: sql<number>`${tweets.likes_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId))
      .returning({ newLikesAmount: tweets.likes_count });
    if (!newLikesAmount) throw new ActionNoReturnError("Like deletion");
    return newLikesAmount;
  });
  return c.json(resp, 200);
});

// retweeted -> post
app.post("/retweets/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.retweet,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(tweetId);
    }
    if (exists.isRetweeted) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is already retweeted by user #${userId}`,
      });
    }
    await tx.insert(retweets).values({
      user_id: userId,
      tweet_id: tweetId,
    });
    const [newRetweetsAmount] = await tx
      .update(tweets)
      .set({
        retweets_count: sql<number>`${tweets.retweets_count} + 1`,
      })
      .where(eq(tweets.tweet_id, tweetId))
      .returning({ newRetweetsAmount: tweets.retweets_count });
    if (!newRetweetsAmount) throw new ActionNoReturnError("Retweet insertion");
    return newRetweetsAmount;
  });
  return c.json(resp, 201);
});

// retweeted -> delete
app.delete("/retweets/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.retweet,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(tweetId);
    }
    if (!exists.isRetweeted) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not retweeted by user #${userId}`,
      });
    }
    await tx
      .delete(retweets)
      .where(and(eq(retweets.tweet_id, tweetId), eq(retweets.user_id, userId)));
    const [newRetweetsAmount] = await tx
      .update(tweets)
      .set({
        retweets_count: sql<number>`${tweets.retweets_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId))
      .returning({ newRetweetsAmount: tweets.retweets_count });
    if (!newRetweetsAmount) throw new ActionNoReturnError("Retweet deletion");
    return newRetweetsAmount;
  });
  return c.json(resp, 200);
});

// saves -> post
app.post("/saves/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.save,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(404);
    }
    if (exists.isSaved) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is already saved by user #${userId}`,
      });
    }
    await tx.insert(saves).values({
      user_id: userId,
      tweet_id: tweetId,
    });
    const [newSavesAmount] = await tx
      .update(tweets)
      .set({
        saves_count: sql<number>`${tweets.saves_count} + 1`,
      })
      .returning({ newSavesAmount: tweets.saves_count })
      .where(eq(tweets.tweet_id, tweetId));
    if (!newSavesAmount) throw new ActionNoReturnError("Save insertion");
    return newSavesAmount;
  });
  return c.json(resp, 201);
});

// saves -> delete
app.delete("/saves/:id{\\d+}", authMiddleware, async (c) => {
  const { id } = c.req.param();
  const tweetId = idNumberSchema.parse(id);
  const userId = c.get("userId");
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.save,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new Tweet404Error(404);
    }
    if (!exists.isSaved) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not saved by user #${userId}`,
      });
    }
    await tx
      .delete(saves)
      .where(and(eq(saves.tweet_id, tweetId), eq(saves.user_id, userId)));
    const [newSavesAmount] = await tx
      .update(tweets)
      .set({
        saves_count: sql<number>`${tweets.saves_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId))
      .returning({ newSavesAmount: tweets.saves_count });
    if (!newSavesAmount) throw new ActionNoReturnError("Save deletion");
    return newSavesAmount;
  });
  return c.json(resp, 200);
});

// main -> post
app.post("/", authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const { hashtag, ...rawTweetData } = globalTweetSchema.parse(
    formData.get("tweet"),
  );
  const userId = c.get("userId");
  const tweetData = globalTweetToDbTweetSchema(userId).parse(rawTweetData);
  const imageFile = imageSchema.parse(formData.get("image"));
  if (imageFile) tweetData.image = await uploadImage(imageFile);
  const response = await db.transaction(async (tx) => {
    const tweetAuthor = await tx.query.users.findFirst({
      columns: {
        user_id: true,
        avatar: true,
        username: true,
      },
      where: { user_id: tweetData.user_id },
      extras: { is_followed: sql<false>`FALSE` },
    });
    if (!tweetAuthor) {
      throw new HTTPException(404, {
        message: `User with id #${tweetData.user_id} that tries to create a tweet can't be found in database`,
      });
    }
    let hashtagId: number | undefined;
    let replyTweetData;
    let newRepliesAmount: number | undefined;
    // if we have replyTo -> check that such tweet exists or 404
    if (tweetData.reply_to) {
      replyTweetData = await tx.query.tweets.findFirst({
        columns: { tweet_id: true },
        with: {
          author: { columns: { username: true } },
        },
        where: { tweet_id: tweetData.reply_to },
      });

      if (!replyTweetData) {
        throw new Tweet404Error(404, true);
      }
      const [newRepliesResponse] = await tx
        .update(tweets)
        .set({
          replies_count: sql<number>`${tweets.replies_count} + 1`,
        })
        .where(eq(tweets.tweet_id, tweetData.reply_to))
        .returning({ newRepliesAmount: tweets.replies_count });
      if (!newRepliesResponse) throw new ActionNoReturnError("Reply");
      newRepliesAmount = newRepliesResponse.newRepliesAmount;
    }
    // try to create tweet with data we have, return its id
    const [insertedTweet] = await tx
      .insert(tweets)
      .values(tweetData)
      .returning();

    if (!insertedTweet) {
      throw new HTTPException(500, {
        message:
          "Tweet was inserted inside transaction but for whatever reason nothing was returned, realistically this should never happen but typescript need this validation",
      });
    }

    // if we have hashtag -> try to insert it with upset -> try to return its id
    if (hashtag) {
      hashtagId = (
        await tx
          .insert(hashtags)
          .values({
            hashtag,
          })
          .onConflictDoUpdate({
            target: hashtags.hashtag_guard,
            set: { hashtag: sql.raw(`excluded.${hashtags.hashtag.name}`) },
          })
          .returning({ hashtag_id: hashtags.hashtag_id })
      )[0]?.hashtag_id;
      // if we have don't have hashtag id throw an error
      if (!hashtagId) {
        throw new HTTPException(500, {
          message:
            "For some reason hashtag was not inserted, remove hashtag or change it and try again",
        });
      }
      // insert tweets_hashtags hashtag id and created tweet id
      await tx
        .insert(tweets_hashtags)
        .values({ tweet_id: insertedTweet.tweet_id, hashtag_id: hashtagId });
      // update hashtag id tweets count + 1
      await tx
        .update(hashtags)
        .set({
          tweets_count: sql<number>`${hashtags.tweets_count} + 1`,
        })
        .where(eq(hashtags.hashtag_id, hashtagId));
    }

    const parsedResponse: TweetResponse = {
      tweet: dbTweetToGlobalTweetSchema.parse({
        ...insertedTweet,
        author: tweetAuthor,
        reply_to_author: replyTweetData && {
          tweet_id: replyTweetData.tweet_id,
          username: replyTweetData.author.username,
        },
        hashtag,
      }),
      newRepliesAmount,
    };
    return parsedResponse;
  });
  return c.json(response, 201);
});

export default app;

//temporary for testing purposes
// app.get("/test-form", (c) => {
//   const mockTweet: TweetInput = {
//     content: "some text",
//     hashtag: "idkTag",
//   };
//   return c.html(`
//     <!DOCTYPE html>
//     <html>
//       <head><title>Test Tweet</title></head>
//       <body>
//         <form action="/tweets" method="POST" enctype="multipart/form-data">
//           <textarea name="content" placeholder="What's happening?" required>${JSON.stringify(mockTweet)}</textarea><br/>
//           <input type="file" name="image" accept="image/*" /><br/>
//           <button type="submit">Tweet</button>
//         </form>
//       </body>
//     </html>
//   `);
// });
