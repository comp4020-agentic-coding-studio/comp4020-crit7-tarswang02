import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// dueAt is a plain YYYY-MM-DD date, not a datetime: the deployed machine and
// the student don't share a timezone, and comparing it lexically against
// today's ISO date (see isOverdue in db.ts) avoids ever parsing a Date or
// caring what timezone anything is in.
export const deadlines = sqliteTable("deadlines", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  course: text().notNull(),
  dueAt: text("due_at").notNull(),
  weightPercent: int("weight_percent"),
  done: int({ mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Deadline = typeof deadlines.$inferSelect;
