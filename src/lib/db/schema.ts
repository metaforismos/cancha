import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const dominantFootEnum = pgEnum("dominant_foot", [
  "left",
  "right",
  "both",
]);

export const groupRoleEnum = pgEnum("group_role", ["admin", "player"]);

export const matchFormatEnum = pgEnum("match_format", [
  "5v5",
  "7v7",
  "8v8",
  "11v11",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "open",
  "closed",
  "in_progress",
  "completed",
]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "waitlisted",
  "removed",
]);

export const matchEventTypeEnum = pgEnum("match_event_type", [
  "goal",
  "assist",
  "injury",
  "mvp_vote",
]);

// ─── Tables ──────────────────────────────────────────────

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  alias: text("alias"),
  shirtNumber: integer("shirt_number"),
  positions: jsonb("positions").$type<string[]>().notNull().default([]),
  dominantFoot: dominantFootEnum("dominant_foot").notNull().default("right"),
  selfSkills: jsonb("self_skills")
    .$type<Record<string, number>>()
    .notNull()
    .default({}),
  birthDate: date("birth_date"),
  isAdmin: boolean("is_admin").notNull().default(false),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const playerRatings = pgTable(
  "player_ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    raterId: uuid("rater_id")
      .notNull()
      .references(() => players.id),
    ratedId: uuid("rated_id")
      .notNull()
      .references(() => players.id),
    skills: jsonb("skills").$type<Record<string, number>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_rater_rated").on(table.raterId, table.ratedId),
  ]
);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => players.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    role: groupRoleEnum("role").notNull().default("player"),
  },
  (table) => [
    uniqueIndex("unique_group_player").on(table.groupId, table.playerId),
  ]
);

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
  date: timestamp("date", { withTimezone: true }).notNull(),
  location: text("location").notNull(),
  locationUrl: text("location_url"),
  format: matchFormatEnum("format").notNull(),
  maxPlayers: integer("max_players").notNull(),
  enrollmentDeadline: timestamp("enrollment_deadline", {
    withTimezone: true,
  }).notNull(),
  status: matchStatusEnum("status").notNull().default("open"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => players.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matchEnrollments = pgTable(
  "match_enrollments",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    status: enrollmentStatusEnum("status").notNull().default("enrolled"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("unique_match_player").on(table.matchId, table.playerId),
  ]
);

export const lineups = pgTable("lineups", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id),
  teamA: jsonb("team_a")
    .$type<{
      formation: string;
      players: { playerId: string; name: string; position: string }[];
    }>()
    .notNull(),
  teamB: jsonb("team_b")
    .$type<{
      formation: string;
      players: { playerId: string; name: string; position: string }[];
    }>()
    .notNull(),
  bench: jsonb("bench").$type<{ playerId: string; name: string }[]>().notNull(),
  justification: text("justification"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matchResults = pgTable("match_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id),
  scoreA: integer("score_a").notNull(),
  scoreB: integer("score_b").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const matchEvents = pgTable("match_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  type: matchEventTypeEnum("type").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
