import { z } from "zod";
import { POSITIONS, SKILLS } from "@/types";

const skillRatingSchema = z.number().int().min(1).max(10);

const skillsSchema = z.object(
  Object.fromEntries(SKILLS.map((s) => [s, skillRatingSchema])) as Record<
    (typeof SKILLS)[number],
    z.ZodNumber
  >
);

export const playerProfileSchema = z.object({
  name: z.string().min(2).max(50),
  alias: z.string().max(30).optional().or(z.literal("")),
  shirtNumber: z.number().int().min(1).max(99).optional().nullable(),
  positions: z
    .array(z.enum(POSITIONS))
    .min(1, "Select at least one position"),
  dominantFoot: z.enum(["left", "right", "both"]),
  selfSkills: skillsSchema,
});

export const ratingSchema = z.object({
  ratedId: z.string().uuid(),
  skills: skillsSchema,
});

export const matchCreateSchema = z.object({
  groupId: z.string().uuid(),
  date: z.string().datetime(),
  location: z.string().min(1),
  locationUrl: z.string().url().optional().or(z.literal("")),
  format: z.enum(["5v5", "7v7", "8v8", "11v11"]),
  maxPlayers: z.number().int().min(2),
  enrollmentDeadline: z.string().datetime(),
});

export const lineupResponseSchema = z.object({
  team_a: z.object({
    formation: z.string(),
    players: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        position: z.string(),
      })
    ),
  }),
  team_b: z.object({
    formation: z.string(),
    players: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        position: z.string(),
      })
    ),
  }),
  bench: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  balance: z.object({
    team_a_avg: z.number(),
    team_b_avg: z.number(),
  }),
  justification: z.string(),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type MatchCreateInput = z.infer<typeof matchCreateSchema>;
export type LineupResponseParsed = z.infer<typeof lineupResponseSchema>;
