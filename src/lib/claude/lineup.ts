import Anthropic from "@anthropic-ai/sdk";
import { lineupResponseSchema } from "@/lib/validators";
import type { LineupRequest, PlayerForLineup } from "./types";

const anthropic = new Anthropic();

function buildPlayerTable(players: PlayerForLineup[]): string {
  const header =
    "| Name | Positions | Foot | Pace | Shot | Pass | Drib | Def | Phys | Head | Avg |";
  const sep =
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";

  const rows = players.map((p) => {
    const s = p.skills;
    return `| ${p.name} | ${p.positions.join(", ")} | ${p.dominantFoot} | ${s.pace ?? "-"} | ${s.shooting ?? "-"} | ${s.passing ?? "-"} | ${s.dribbling ?? "-"} | ${s.defending ?? "-"} | ${s.physical ?? "-"} | ${s.heading ?? "-"} | ${p.avgRating.toFixed(1)} |`;
  });

  return [header, sep, ...rows].join("\n");
}

export async function generateLineup(request: LineupRequest) {
  const lockInstructions = request.lockedPlayers
    ? `\n**Locked players** (must stay on their assigned team):\n- Team A: ${request.lockedPlayers.team_a?.join(", ") || "none"}\n- Team B: ${request.lockedPlayers.team_b?.join(", ") || "none"}`
    : "";

  const prompt = `You are a soccer coach AI. Generate two balanced teams from the following player pool.

**Match format**: ${request.format}
**Players**: ${request.players.length}

**Player data**:
${buildPlayerTable(request.players)}
${lockInstructions}

**Instructions**:
1. Create two teams with a named formation each.
2. Assign each player to a specific position matching their profile.
3. Balance teams by overall average rating (max 0.3 difference).
4. Consider position coverage — don't leave gaps.
5. Respect dominant foot for wing positions.
6. Assign bench players if applicable.
7. Return structured JSON only, no other text.

**Output format** (JSON only):
{
  "team_a": { "formation": "4-3-3", "players": [{"id": "...", "name": "...", "position": "LW"}] },
  "team_b": { "formation": "4-4-2", "players": [{"id": "...", "name": "...", "position": "ST"}] },
  "bench": [{"id": "...", "name": "..."}],
  "balance": { "team_a_avg": 3.4, "team_b_avg": 3.5 },
  "justification": "..."
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in lineup response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return lineupResponseSchema.parse(parsed);
}
