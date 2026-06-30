import { Hono } from "hono";
import usersFeed from "./users.feed.js";

const app = new Hono();
app.route("/", usersFeed);

export default app;
