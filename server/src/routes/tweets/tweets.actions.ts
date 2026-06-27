import { Hono } from "hono";

const app = new Hono();

app.post("/", (c) => c.json({ status: 200, message: "Created tweet" }));
app.post("/likes/:id{\\d+}", (c) => {
  const id = Number(c.req.param("id"));
  if (id === 4) return c.json({ error: "Tweet with such id not found" }, 404);
  return c.json({ status: 200, message: `Liked tweet ${id}` });
});

export default app;
