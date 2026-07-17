import "dotenv/config";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const client = postgres(connectionString, { max: 1 });

async function main() {
  try {
    await migrate(drizzle(client), { migrationsFolder: path.resolve("migrations") });
    console.info("Database migrations completed.");
  } finally {
    await client.end();
  }
}

void main();
