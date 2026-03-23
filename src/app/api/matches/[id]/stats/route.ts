import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatch, getMatchResult, getMatchEvents, autoUpdateMatchStatus } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { matchResults, matchEvents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if stats can be recorded for a match.
 * Allowed when match is in_progress or completed within last 24 hours.
 */
function canRecord(match: { status: string; endTime: Date | null }): boolean {
  if (match.status === "in_progress") return true;
  if (match.status === "completed" && match.endTime) {
    const now = new Date();
    return now.getTime() - new Date(match.endTime).getTime() < 24 * 60 * 60 * 1000;
  }
  return false;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await autoUpdateMatchStatus(id);

  const match = await getMatch(id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const result = await getMatchResult(id);
  const events = await getMatchEvents(id);

  return NextResponse.json({
    match: {
      id: match.id,
      format: match.format,
      status: match.status,
      date: match.date,
      endTime: match.endTime,
      location: match.location,
      teamAName: match.teamAName || "Equipo A",
      teamBName: match.teamBName || "Equipo B",
    },
    result,
    events,
    canRecordStats: canRecord(match),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await autoUpdateMatchStatus(id);

  const match = await getMatch(id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (!canRecord(match)) {
    return NextResponse.json(
      { error: "No se pueden registrar estadísticas para este partido" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { action } = body;

  // Action: save_score
  if (action === "save_score") {
    const { scoreA, scoreB } = body;
    if (typeof scoreA !== "number" || typeof scoreB !== "number" || scoreA < 0 || scoreB < 0) {
      return NextResponse.json({ error: "Marcador inválido" }, { status: 400 });
    }

    // Upsert: delete existing then insert
    await db.delete(matchResults).where(eq(matchResults.matchId, id));
    const [result] = await db
      .insert(matchResults)
      .values({ matchId: id, scoreA, scoreB })
      .returning();

    return NextResponse.json(result);
  }

  // Action: add_event
  if (action === "add_event") {
    const { playerId, type } = body;
    const validTypes = ["goal", "assist", "yellow_card", "red_card"];

    if (!playerId || !validTypes.includes(type)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const [event] = await db
      .insert(matchEvents)
      .values({
        matchId: id,
        playerId,
        type,
        meta: body.meta || {},
      })
      .returning();

    return NextResponse.json(event);
  }

  // Action: remove_event
  if (action === "remove_event") {
    const { eventId } = body;
    if (!eventId) {
      return NextResponse.json({ error: "eventId requerido" }, { status: 400 });
    }

    await db.delete(matchEvents).where(eq(matchEvents.id, eventId));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}
