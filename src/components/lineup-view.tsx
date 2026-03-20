"use client";

interface TeamData {
  formation: string;
  players: { playerId: string; name: string; position: string }[];
}

// Position coordinates on a pitch (percentage-based)
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  GK: { x: 50, y: 90 },
  CB: { x: 50, y: 72 },
  LCB: { x: 30, y: 72 },
  RCB: { x: 70, y: 72 },
  LB: { x: 12, y: 65 },
  RB: { x: 88, y: 65 },
  LWB: { x: 15, y: 58 },
  RWB: { x: 85, y: 58 },
  CDM: { x: 50, y: 55 },
  LCDM: { x: 35, y: 55 },
  RCDM: { x: 65, y: 55 },
  CM: { x: 50, y: 45 },
  LCM: { x: 30, y: 45 },
  RCM: { x: 70, y: 45 },
  CAM: { x: 50, y: 35 },
  LCAM: { x: 35, y: 35 },
  RCAM: { x: 65, y: 35 },
  LW: { x: 12, y: 25 },
  RW: { x: 88, y: 25 },
  LM: { x: 12, y: 45 },
  RM: { x: 88, y: 45 },
  ST: { x: 50, y: 15 },
  LST: { x: 35, y: 15 },
  RST: { x: 65, y: 15 },
  CF: { x: 50, y: 20 },
  LCF: { x: 35, y: 20 },
  RCF: { x: 65, y: 20 },
};

function getBaseCoords(position: string): { x: number; y: number } {
  return POSITION_COORDS[position] || { x: 50, y: 50 };
}

/**
 * Resolve overlapping positions by spreading players that share the same coords.
 * Groups by coordinate, then fans them out horizontally.
 */
function resolvePositions(
  players: TeamData["players"]
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();

  // First pass: get base coords for everyone
  const coordsByPlayer = players.map((p) => ({
    playerId: p.playerId,
    position: p.position,
    coords: getBaseCoords(p.position),
  }));

  // Group by coordinate (using rounded coords as key to detect near-overlaps too)
  const groups = new Map<string, typeof coordsByPlayer>();
  for (const entry of coordsByPlayer) {
    const key = `${Math.round(entry.coords.x)},${Math.round(entry.coords.y)}`;
    const group = groups.get(key) || [];
    group.push(entry);
    groups.set(key, group);
  }

  // Spread groups with more than 1 player
  for (const [, group] of groups) {
    if (group.length === 1) {
      result.set(group[0].playerId, group[0].coords);
    } else {
      const baseY = group[0].coords.y;
      // Calculate spread: distribute evenly across available width
      const spreadWidth = Math.min(20 * group.length, 76); // max spread 76% of pitch
      const centerX = group[0].coords.x;
      const startX = Math.max(8, centerX - spreadWidth / 2);
      const step = group.length > 1 ? spreadWidth / (group.length - 1) : 0;

      group.forEach((entry, i) => {
        const x = group.length === 1 ? centerX : startX + step * i;
        result.set(entry.playerId, {
          x: Math.min(92, Math.max(8, x)),
          y: baseY,
        });
      });
    }
  }

  return result;
}

export function PitchView({
  team,
  label,
  color,
}: {
  team: TeamData;
  label: string;
  color: string;
}) {
  const resolvedPositions = resolvePositions(team.players);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{label}</h3>
        <span className="text-sm text-muted-foreground">{team.formation}</span>
      </div>
      <div className="relative w-full aspect-[3/4] bg-green-900/30 rounded-lg border border-green-800/50 overflow-hidden">
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-green-700/30" />
        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-green-700/30" />
        {/* Penalty areas */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/5 border border-green-700/30 border-b-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/5 border border-green-700/30 border-t-0" />

        {/* Players */}
        {team.players.map((player) => {
          const coords = resolvedPositions.get(player.playerId) || getBaseCoords(player.position);
          return (
            <div
              key={player.playerId}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{ backgroundColor: color }}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[10px] text-white/80 mt-0.5 text-center leading-tight max-w-16 truncate">
                {player.name.split(" ")[0]}
              </span>
              <span className="text-[9px] text-white/50">
                {player.position}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
