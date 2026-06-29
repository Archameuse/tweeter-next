import { Database } from "@tursodatabase/database";
import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
// import { drizzle } from "drizzle-orm/tursodatabase/database";
import { relations } from "./relations.js";
import * as schema from "./schema.js";
if (!process.env.DB_FILE_NAME) throw new Error("No DB FILE FOUND IN .env");

const client = createClient({
  url: "file:" + process.env.DB_FILE_NAME,
});
export const db = drizzle({ client, schema, relations });

// const client = new Database(process.env.DB_FILE_NAME);
// export const db = drizzle({ client, schema, relations });
