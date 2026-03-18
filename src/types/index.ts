export const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "CAM",
  "LW",
  "RW",
  "ST",
] as const;

export type Position = (typeof POSITIONS)[number];

export const SKILLS = [
  "pace",
  "shooting",
  "passing",
  "dribbling",
  "defending",
  "physical",
  "heading",
] as const;

export type Skill = (typeof SKILLS)[number];

export type SkillRatings = Record<Skill, number>;

export const MATCH_FORMATS = ["5v5", "7v7", "8v8", "11v11"] as const;
export type MatchFormat = (typeof MATCH_FORMATS)[number];

export const FORMAT_PLAYER_COUNTS: Record<MatchFormat, number> = {
  "5v5": 10,
  "7v7": 14,
  "8v8": 16,
  "11v11": 22,
};

export type DominantFoot = "left" | "right" | "both";

export interface LineupPlayer {
  playerId: string;
  name: string;
  position: string;
}

export interface LineupTeam {
  formation: string;
  players: LineupPlayer[];
}

export interface LineupResponse {
  team_a: LineupTeam;
  team_b: LineupTeam;
  bench: { playerId: string; name: string }[];
  balance: { team_a_avg: number; team_b_avg: number };
  justification: string;
}
