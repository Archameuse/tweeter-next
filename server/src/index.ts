import { Database } from "@tursodatabase/database";
import "dotenv/config";
import { drizzle } from "drizzle-orm/tursodatabase/database";

if (!process.env.DB_FILE_NAME) throw new Error("No DB FILE FOUND IN .env");

const client = new Database(process.env.DB_FILE_NAME, {});
const db = drizzle({ client });
