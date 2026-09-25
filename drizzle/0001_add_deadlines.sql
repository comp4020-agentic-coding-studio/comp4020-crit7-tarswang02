CREATE TABLE `deadlines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`course` text NOT NULL,
	`due_at` text NOT NULL,
	`weight_percent` integer,
	`done` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
