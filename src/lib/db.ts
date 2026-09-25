import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type Deadline, deadlines } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

export type { Deadline };

export function listDeadlines(): Deadline[] {
  return db.select().from(deadlines).orderBy(asc(deadlines.dueAt)).all();
}

export function addDeadline(input: {
  title: string;
  course: string;
  dueAt: string;
  weightPercent: number | null;
}): Deadline {
  return db.insert(deadlines).values(input).returning().get();
}

export function toggleDeadlineDone(id: number): Deadline | undefined {
  const current = db.select().from(deadlines).where(eq(deadlines.id, id)).get();
  if (!current) return undefined;
  return db
    .update(deadlines)
    .set({ done: !current.done })
    .where(eq(deadlines.id, id))
    .returning()
    .get();
}

// Today's date as YYYY-MM-DD in the SAME format dueAt is stored in, so
// "overdue" is a plain string comparison — no Date parsing, no timezone.
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(deadline: Deadline): boolean {
  return !deadline.done && deadline.dueAt < today();
}
