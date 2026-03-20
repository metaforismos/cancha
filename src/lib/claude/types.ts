export interface PlayerForLineup {
  id: string;
  name: string;
  positions: string[];
  dominantFoot: string;
  skills: Record<string, number>;
  avgRating: number;
}

export interface LineupRequest {
  format: string;
  players: PlayerForLineup[];
  mode?: "both" | "single";
  formation?: string;
  lockedPlayers?: {
    team_a?: string[];
    team_b?: string[];
  };
}
