import Database, { type Database as BetterSqlite3Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const getDatabasePath = (): string => {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  const candidates = [
    path.resolve(process.cwd(), "packages/database/vortile-delivery.db"),
    path.resolve(process.cwd(), "../packages/database/vortile-delivery.db"),
    path.resolve(process.cwd(), "../../packages/database/vortile-delivery.db"),
    path.resolve(__dirname, "../vortile-delivery.db"),
    path.resolve(process.cwd(), "vortile-delivery.db"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

const dbPath = getDatabasePath();

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export type { BetterSqlite3Database };
export const sqlite: BetterSqlite3Database = new Database(dbPath);

// Enable WAL mode and foreign keys for high SQLite performance and integrity
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export * from "./schema";
export * from "drizzle-orm";
