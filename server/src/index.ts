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

const app = new Hono();
app.route("/user", userRoutes);
app.route("/tweets", tweetsRoutes);

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
