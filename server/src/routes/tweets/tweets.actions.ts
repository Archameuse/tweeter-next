import { db } from "@/db/index.js";
import { likes, retweets, saves, tweets } from "@/db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { Hono } from "hono";
import z from "zod";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import {
  ACTION,
  TweetExistsAndActionInput,
  tweetExistsAndActionQuerySchema,
} from "./tweets.schema.js";
import { HTTPException } from "hono/http-exception";

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

// main -> post (no delete, delete would only be on user page user profile)

export default app;
