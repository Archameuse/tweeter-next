import { Hono } from "hono";
import tweetsFeed from "./tweets.feed.js";
import tweetsActions from "./tweets.actions.js";

const app = new Hono();
app.route("/", tweetsFeed);
app.route("/", tweetsActions);

export default app;
