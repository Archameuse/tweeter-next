// import { Database } from "@tursodatabase/database";
// import "dotenv/config";
// import { drizzle } from "drizzle-orm/tursodatabase/database";
// if (!process.env.DB_FILE_NAME) throw new Error("No DB FILE FOUND IN .env");

// const client = new Database(process.env.DB_FILE_NAME, {});
// const db = drizzle({ client });

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import userRoutes from "@/routes/user.js";
import tweetsRoutes from "@/routes/tweets/tweets.routes.js";
import { HTTPException } from "hono/http-exception";
import z, { ZodError } from "zod";
import { db } from "./db/index.js";
import { sql } from "drizzle-orm";

const app = new Hono();

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
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

app.route("/user", userRoutes);
app.route("/tweets", tweetsRoutes);

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
