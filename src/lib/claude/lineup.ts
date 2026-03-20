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
  const mode = request.mode || "both";
  const formationInstruction = request.formation
    ? `\n**Formación solicitada**: ${request.formation} — Ambos equipos DEBEN usar esta formación exacta.`
    : "";

  const lockInstructions = request.lockedPlayers
    ? `\n**Jugadores fijos** (deben quedarse en su equipo asignado):\n- Equipo A: ${request.lockedPlayers.team_a?.join(", ") || "ninguno"}\n- Equipo B: ${request.lockedPlayers.team_b?.join(", ") || "ninguno"}`
    : "";

  const prompt = mode === "single"
    ? `Eres un director técnico de fútbol con IA. Genera UNA alineación de equipo a partir del siguiente grupo de jugadores. Responde siempre en español.

**Formato del partido**: ${request.format}
**Jugadores**: ${request.players.length}
${formationInstruction}

**Datos de jugadores**:
${buildPlayerTable(request.players)}

**Instrucciones**:
1. Crea un equipo ${request.formation ? `usando la formación ${request.formation}` : "con una formación definida"}.
2. Selecciona los mejores jugadores y asigna a cada uno una posición que coincida con su perfil.
3. Considera la cobertura de posiciones — no dejes huecos.
4. Respeta el pie dominante para las posiciones de extremo.
5. Los jugadores restantes van al banco de suplentes.
6. Devuelve solo JSON estructurado, sin otro texto.

**Formato de salida** (solo JSON):
{
  "team_a": { "formation": "${request.formation || "4-3-3"}", "players": [{"id": "...", "name": "...", "position": "LW"}] },
  "bench": [{"id": "...", "name": "..."}],
  "balance": { "team_a_avg": 3.4, "team_b_avg": 0 },
  "justification": "Explicación en español de las decisiones tácticas..."
}`
    : `Eres un director técnico de fútbol con IA. Genera dos equipos equilibrados a partir del siguiente grupo de jugadores. Responde siempre en español.

**Formato del partido**: ${request.format}
**Jugadores**: ${request.players.length}
${formationInstruction}

**Datos de jugadores**:
${buildPlayerTable(request.players)}
${lockInstructions}

**Instrucciones**:
1. Crea dos equipos ${request.formation ? `ambos usando la formación ${request.formation}` : "con una formación definida cada uno"}.
2. Asigna a cada jugador una posición específica que coincida con su perfil.
3. Equilibra los equipos por rating promedio (diferencia máxima 0.3).
4. Considera la cobertura de posiciones — no dejes huecos.
5. Respeta el pie dominante para las posiciones de extremo.
6. Asigna suplentes si corresponde.
7. Devuelve solo JSON estructurado, sin otro texto.

**Formato de salida** (solo JSON):
{
  "team_a": { "formation": "${request.formation || "4-3-3"}", "players": [{"id": "...", "name": "...", "position": "LW"}] },
  "team_b": { "formation": "${request.formation || "4-4-2"}", "players": [{"id": "...", "name": "...", "position": "ST"}] },
  "bench": [{"id": "...", "name": "..."}],
  "balance": { "team_a_avg": 3.4, "team_b_avg": 3.5 },
  "justification": "Explicación en español del balance entre equipos..."
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
