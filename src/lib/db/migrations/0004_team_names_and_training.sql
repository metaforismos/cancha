-- Add team names to matches
ALTER TABLE "matches" ADD COLUMN "team_a_name" text;
ALTER TABLE "matches" ADD COLUMN "team_b_name" text;

-- Add "training" to match_category enum
ALTER TYPE "match_category" ADD VALUE IF NOT EXISTS 'training';
