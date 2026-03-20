export const POSITIONS = [
  "GK",
  "CB",
  "LB",
  "RB",
  "CDM",
  "CM",
  "LW",
  "RW",
  "ST",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Arquero",
  CB: "Defensa Central",
  LB: "Lateral Izq.",
  RB: "Lateral Der.",
  CDM: "Volante Def.",
  CM: "Mediocampista",
  LW: "Extremo Izq.",
  RW: "Extremo Der.",
  ST: "Delantero",
};

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

export const MATCH_CATEGORIES = ["friendly", "league"] as const;
export type MatchCategory = (typeof MATCH_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<MatchCategory, string> = {
  friendly: "Partido amistoso",
  league: "Partido de liga",
};

export const FORMAT_FILTER_LABELS: Record<string, string> = {
  all: "Todos",
  "5v5": "Fútbol 5",
  "7v7": "Fútbol 7",
  "11v11": "Fútbol 11",
};

export const FORMAT_FILTERS = ["all", "5v5", "7v7", "11v11"] as const;
export type FormatFilter = (typeof FORMAT_FILTERS)[number];

/** Which match formats are included in each filter */
export const FORMAT_FILTER_MAP: Record<FormatFilter, string[]> = {
  all: ["5v5", "7v7", "8v8", "11v11"],
  "5v5": ["5v5"],
  "7v7": ["7v7", "8v8"],
  "11v11": ["11v11"],
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
