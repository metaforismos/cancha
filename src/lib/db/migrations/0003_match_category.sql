-- Add match_category enum
CREATE TYPE "match_category" AS ENUM ('friendly', 'league');

-- Add category column to matches with default 'friendly'
ALTER TABLE "matches" ADD COLUMN "category" "match_category" NOT NULL DEFAULT 'friendly';
