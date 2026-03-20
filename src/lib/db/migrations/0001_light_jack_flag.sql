ALTER TABLE "groups" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "alias" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "shirt_number" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;