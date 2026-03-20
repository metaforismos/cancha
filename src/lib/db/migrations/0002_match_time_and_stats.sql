-- Add end_time column to matches
ALTER TABLE "matches" ADD COLUMN "end_time" timestamp with time zone;

-- Add yellow_card and red_card to match_event_type enum
ALTER TYPE "match_event_type" ADD VALUE IF NOT EXISTS 'yellow_card';
ALTER TYPE "match_event_type" ADD VALUE IF NOT EXISTS 'red_card';
