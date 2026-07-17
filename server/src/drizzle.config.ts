import { defineConfig } from "drizzle-kit";

if (!process.env.TURSO_TOKEN) throw new Error("No TURSO_TOKEN in .env");
if (!process.env.TURSO_URL) throw new Error("No TURSO_URL in .env");

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN,
  },
});
