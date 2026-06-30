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
import { and, eq, like, sql } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import z from "zod";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import {
  ACTION,
  dbTweetToGlobalTweetSchema,
  DbTweetType,
  globalTweetSchema,
  globalTweetToDbTweetSchema,
  TweetExistsAndActionInput,
  tweetExistsAndActionQuerySchema,
} from "./tweets.schema.js";
import { HTTPException } from "hono/http-exception";
import uploadImage from "@/utils/uploadImage.js";
import { imageSchema } from "@/schema.js";
import { text } from "drizzle-orm/singlestore-core/columns/text";

const app = new Hono();

const userId = 1;

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
app.post("/likes/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.like,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
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
    await tx
      .update(tweets)
      .set({
        likes_count: sql<number>`${tweets.likes_count} + 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

// likes -> delete
app.delete("/likes/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.like,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
    }
    if (!exists.isLiked) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not liked by user #${userId}`,
      });
    }
    await tx
      .delete(likes)
      .where(and(eq(likes.tweet_id, tweetId), eq(likes.user_id, userId)));
    await tx
      .update(tweets)
      .set({
        likes_count: sql<number>`${tweets.likes_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

// retweeted -> post
app.post("/retweets/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.retweet,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
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
    await tx
      .update(tweets)
      .set({
        retweets_count: sql<number>`${tweets.retweets_count} + 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

// retweeted -> delete
app.delete("/retweets/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.retweet,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
    }
    if (!exists.isRetweeted) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not retweeted by user #${userId}`,
      });
    }
    await tx
      .delete(retweets)
      .where(and(eq(retweets.tweet_id, tweetId), eq(retweets.user_id, userId)));
    await tx
      .update(tweets)
      .set({
        retweets_count: sql<number>`${tweets.retweets_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

// saves -> post
app.post("/saves/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.save,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
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
    await tx
      .update(tweets)
      .set({
        saves_count: sql<number>`${tweets.saves_count} + 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

// saves -> delete
app.delete("/saves/:id{\\d+}", async (c) => {
  const { id } = c.req.param();
  const tweetId = z.coerce.number().min(1).int().parse(id);
  const resp = await db.transaction(async (tx) => {
    const [exists] = await tweetExistsAndActionQuery(tx, {
      action: ACTION.save,
      tweetId,
      userId,
    });
    if (!exists) {
      throw new HTTPException(404, {
        message: `Tweet with id #${tweetId} does not exist`,
      });
    }
    if (!exists.isSaved) {
      throw new HTTPException(409, {
        message: `Tweet with id #${tweetId} is not saved by user #${userId}`,
      });
    }
    await tx
      .delete(saves)
      .where(and(eq(saves.tweet_id, tweetId), eq(saves.user_id, userId)));
    await tx
      .update(tweets)
      .set({
        saves_count: sql<number>`${tweets.saves_count} - 1`,
      })
      .where(eq(tweets.tweet_id, tweetId));
  });
  return c.body(null, 204);
});

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

// main -> post
app.post("/", async (c) => {
  const formData = await c.req.formData();
  const { hashtag, ...rawTweetData } = globalTweetSchema.parse(
    formData.get("content"),
  );
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
        throw new HTTPException(404, {
          message: `Tweet with id #${tweetData.reply_to} you are trying to reply to does not exists`,
        });
      }
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
    return dbTweetToGlobalTweetSchema.parse({
      ...insertedTweet,
      author: tweetAuthor,
      reply_to_author: replyTweetData && {
        tweet_id: replyTweetData.tweet_id,
        username: replyTweetData.author.username,
      },
      hashtag,
    });
  });
  return c.json(response);
});

export default app;
