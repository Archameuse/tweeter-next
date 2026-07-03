import { Hono } from "hono";
import authActions from "./auth.actions.js";

const app = new Hono();
app.route("/", authActions);

export default app;
