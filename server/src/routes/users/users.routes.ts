import { Hono } from "hono";
import usersFeed from "./users.feed.js";
import usersActions from "./users.actions.js";

const app = new Hono();
app.route("/", usersFeed);
app.route("/", usersActions);
export default app;
