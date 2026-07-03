import { Hono } from "hono";
import authActions from "./auth.actions.js";
import authFeed from "./auth.feed.js";

const app = new Hono();
app.route("/", authActions);
app.route("/", authFeed);

export default app;
