DROP INDEX "runs_email_idx";--> statement-breakpoint
DROP INDEX "briefings_slug_unique";--> statement-breakpoint
DROP INDEX "briefings_slug_idx";--> statement-breakpoint
DROP INDEX "briefings_user_idx";--> statement-breakpoint
DROP INDEX "briefings_email_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `briefing_runs` ALTER COLUMN "user_email" TO "user_email" text;--> statement-breakpoint
CREATE INDEX `runs_email_idx` ON `briefing_runs` (`user_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `briefings_slug_unique` ON `briefings` (`slug`);--> statement-breakpoint
CREATE INDEX `briefings_slug_idx` ON `briefings` (`slug`);--> statement-breakpoint
CREATE INDEX `briefings_user_idx` ON `briefings` (`user_id`);--> statement-breakpoint
CREATE INDEX `briefings_email_idx` ON `briefings` (`user_email`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_briefings` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`user_id` text,
	`user_email` text,
	`date` text NOT NULL,
	`calendar_source` text NOT NULL,
	`calendar_url` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`error_message` text,
	`payload` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_briefings`("id", "slug", "user_id", "user_email", "date", "calendar_source", "calendar_url", "title", "status", "error_message", "payload", "created_at", "updated_at") SELECT "id", "slug", "user_id", "user_email", "date", "calendar_source", "calendar_url", "title", "status", "error_message", "payload", "created_at", "updated_at" FROM `briefings`;--> statement-breakpoint
DROP TABLE `briefings`;--> statement-breakpoint
ALTER TABLE `__new_briefings` RENAME TO `briefings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;