// import { Database } from "@tursodatabase/database";
// import "dotenv/config";
// import { drizzle } from "drizzle-orm/tursodatabase/database";
// if (!process.env.DB_FILE_NAME) throw new Error("No DB FILE FOUND IN .env");

// const client = new Database(process.env.DB_FILE_NAME, {});
// const db = drizzle({ client });

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import userRoutes from "@/routes/users/users.routes.js";
import tweetsRoutes from "@/routes/tweets/tweets.routes.js";
import authRoutes from "@/routes/auth/auth.routes.js";
import { HTTPException } from "hono/http-exception";
import z, { ZodError } from "zod";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err); // logs unexpected and zod errors
  if (err instanceof ZodError) {
    return c.json(
      {
        message: "Validation Error",
        errors: z.treeifyError(err),
      },
      400,
    );
  }
  return c.json({ message: "Internal Server Error" }, 500);
});

app.route("/users", userRoutes);
app.route("/tweets", tweetsRoutes);
app.route("/auth", authRoutes);

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    db.run(sql`SELECT 1`)
      .then(() => console.log("Turso connection is ready"))
      .catch((err) => console.error("Turso warmup failed", err));
  },
);
