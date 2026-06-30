import { Hono } from "hono";

const app = new Hono();

// app.get('')
app.get("/", (c) => c.text("Hello Users"));

export default app;
