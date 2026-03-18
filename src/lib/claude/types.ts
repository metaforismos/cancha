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
  lockedPlayers?: {
    team_a?: string[];
    team_b?: string[];
  };
}
