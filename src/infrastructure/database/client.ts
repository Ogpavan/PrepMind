import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "@/config/env";

const globalForDb = globalThis as unknown as { sqlClient?: ReturnType<typeof postgres> };

export const sqlClient =
  globalForDb.sqlClient ??
  postgres(env.DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 15 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
    transform: { undefined: null },
  });

if (process.env.NODE_ENV !== "production") globalForDb.sqlClient = sqlClient;

export const db = drizzle(sqlClient, { schema });
export type Database = typeof db;
