import { Database } from "@tursodatabase/database";
// import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { relations } from "./relations.js";
import * as schema from "./schema.js";
if (!process.env.TURSO_TOKEN) throw new Error("No TURSO_TOKEN in .env");
if (!process.env.TURSO_URL) throw new Error("No TURSO_URL in .env");

// const client = createClient({
//   url: "file:" + process.env.DB_FILE_NAME,
// });
// export const db = drizzle({ client, schema, relations });

// const client = new Database(process.env.DB_FILE_NAME);
export const db = drizzle({
  connection: {
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  },
  schema,
  relations,
});
