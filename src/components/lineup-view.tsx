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
  CDM: { x: 50, y: 55 },
  LCDM: { x: 35, y: 55 },
  RCDM: { x: 65, y: 55 },
  CM: { x: 50, y: 45 },
  LCM: { x: 30, y: 45 },
  RCM: { x: 70, y: 45 },
  CAM: { x: 50, y: 35 },
  LW: { x: 12, y: 25 },
  RW: { x: 88, y: 25 },
  LM: { x: 12, y: 45 },
  RM: { x: 88, y: 45 },
  ST: { x: 50, y: 15 },
  LST: { x: 35, y: 15 },
  RST: { x: 65, y: 15 },
  CF: { x: 50, y: 20 },
};

function getCoords(position: string) {
  return POSITION_COORDS[position] || { x: 50, y: 50 };
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
          const coords = getCoords(player.position);
          return (
            <div
              key={player.playerId}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
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
