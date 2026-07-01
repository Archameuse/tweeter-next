import { defineRelations, SQL, sql } from "drizzle-orm";
import {
  check,
  customType,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

const citext = customType<{ data: string }>({
  dataType() {
    return "TEXT COLLATE NOCASE";
  },
});

export const users = sqliteTable(
  "users",
  {
    user_id: integer("user_id", { mode: "number" }).primaryKey({
      autoIncrement: true,
    }),
    email: text("email").notNull().unique(),
    email_guard: text("email_guard")
      .unique()
      .generatedAlwaysAs((): SQL => sql`lower(${users.email})`, {
        mode: "virtual",
      }),
    password: text("password", { mode: "text" }).notNull(),
    username: text("username", { mode: "text" }).notNull().unique(),
    username_guard: text("username_guard")
      .unique()
      .generatedAlwaysAs((): SQL => sql`lower(${users.username})`, {
        mode: "virtual",
      }),
    status: text("status", { mode: "text" }),
    avatar: text("avatar", { mode: "text" }),
    banner: text("banner", { mode: "text" }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check(
      "email_validation_check",
      sql`${table.email} LIKE '%_@_%._%' AND instr(${table.email}, ' ') = 0`,
    ),
    check(
      "username_validation_check",
      sql`${table.username} NOT LIKE '% ' 
      AND ${table.username} NOT LIKE ' %'
      AND (length(${table.username}) - length(replace(${table.username}, ' ',''))) <= 1`,
    ),
  ],
);

export const sessions = sqliteTable("sessions", {
  session_id: text("session_id", { mode: "text" }).primaryKey(),
  user_id: integer("user_id", { mode: "number" })
    .notNull()
    .references(() => users.user_id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  expires_at: integer("expires_at", { mode: "timestamp" }).notNull(),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  ip_address: text("ip_address", { mode: "text" }).notNull(),
  user_agent: text("user_agent", { mode: "text" }).notNull(),
});

export const follows = sqliteTable(
  "follows",
  {
    follower_id: integer("follower_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    followed_id: integer("followed_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.follower_id, table.followed_id] }),
    index("follows_followed_id_follower_id_index").on(
      table.followed_id,
      table.follower_id,
    ),
    check(
      "self_follow_validation_check",
      sql`${table.follower_id} <> ${table.followed_id}`,
    ),
  ],
);

export const tweets = sqliteTable(
  "tweets",
  {
    tweet_id: integer("tweet_id", { mode: "number" }).primaryKey({
      autoIncrement: true,
    }),
    content: text("content", { mode: "text" }).notNull(),
    only_followers: integer("only_followers", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image", { mode: "text" }),
    user_id: integer("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id),
    reply_to: integer("reply_to", { mode: "number" }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    likes_count: integer("likes_count", { mode: "number" })
      .notNull()
      .default(0),
    replies_count: integer("replies_count", { mode: "number" })
      .notNull()
      .default(0),
    retweets_count: integer("retweets_count", { mode: "number" })
      .notNull()
      .default(0),
    saves_count: integer("saves_count", { mode: "number" })
      .notNull()
      .default(0),
  },
  (table) => [
    foreignKey({ columns: [table.reply_to], foreignColumns: [table.tweet_id] })
      .onDelete("set null")
      .onUpdate("cascade"),
  ],
);

export const hashtags = sqliteTable(
  "hashtags",
  {
    hashtag_id: integer("hashtag_id", { mode: "number" }).primaryKey({
      autoIncrement: true,
    }),
    hashtag: text("hashtag", { length: 64, mode: "text" }).notNull().unique(),
    hashtag_guard: text("hashtag_guard", { length: 64, mode: "text" })
      .unique()
      .generatedAlwaysAs((): SQL => sql`lower(${hashtags.hashtag})`, {
        mode: "virtual",
      }),
    tweets_count: integer("tweets_count", { mode: "number" })
      .notNull()
      .default(0),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    check(
      "hashtag_validation_check",
      sql`length(${table.hashtag}) > 0
      AND length(${table.hashtag}) <= 64
      AND instr(${table.hashtag}, ' ') = 0
      `,
    ),
  ],
);

export const tweets_hashtags = sqliteTable(
  "tweets_hashtags",
  {
    tweet_id: integer("tweet_id", { mode: "number" })
      .notNull()
      .references(() => tweets.tweet_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    hashtag_id: integer("hashtag_id", { mode: "number" })
      .notNull()
      .references(() => hashtags.hashtag_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.tweet_id, table.hashtag_id] })],
);

export const likes = sqliteTable(
  "likes",
  {
    user_id: integer("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tweet_id: integer("tweet_id", { mode: "number" })
      .notNull()
      .references(() => tweets.tweet_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.tweet_id] })],
);
export const saves = sqliteTable(
  "saves",
  {
    user_id: integer("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tweet_id: integer("tweet_id", { mode: "number" })
      .notNull()
      .references(() => tweets.tweet_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.tweet_id] })],
);
export const retweets = sqliteTable(
  "retweets",
  {
    user_id: integer("user_id", { mode: "number" })
      .notNull()
      .references(() => users.user_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tweet_id: integer("tweet_id", { mode: "number" })
      .notNull()
      .references(() => tweets.tweet_id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    created_at: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.user_id, table.tweet_id] })],
);
