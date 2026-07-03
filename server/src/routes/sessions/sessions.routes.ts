import { Hono } from "hono";
import sessionsActions from "./sessions.actions.js";

const app = new Hono();
app.route("/", sessionsActions);

export default app;
