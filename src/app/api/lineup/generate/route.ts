import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  matches,
  matchEnrollments,
  players,
  playerRatings,
  lineups,
  groupMembers,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { generateLineup } from "@/lib/claude/lineup";
import { claudeLimiter } from "@/lib/rate-limit";
import type { PlayerForLineup } from "@/lib/claude/types";
import type { SkillRatings } from "@/types";
import { SKILLS } from "@/types";

export async function POST(request: NextRequest) {
  try {
    await claudeLimiter.consume("global");
  } catch {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, lockedPlayers, mode, formation } = await request.json();

  if (!matchId) {
    return NextResponse.json(
      { error: "matchId required" },
      { status: 400 }
    );
  }

  // Get match
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Verify user is admin (super admin or group admin)
  if (!session.player.isAdmin) {
    const [membership] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, match.groupId),
          eq(groupMembers.playerId, session.player.id),
          eq(groupMembers.role, "admin")
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
  }

  // Check regeneration limit
  const existingLineups = await db
    .select({ id: lineups.id })
    .from(lineups)
    .where(eq(lineups.matchId, matchId));

  if (existingLineups.length >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 regenerations reached" },
      { status: 429 }
    );
  }

  // Get enrolled players with their ratings
  const enrolledPlayers = await db
    .select({
      player: players,
    })
    .from(matchEnrollments)
    .innerJoin(players, eq(matchEnrollments.playerId, players.id))
    .where(
      and(
        eq(matchEnrollments.matchId, matchId),
        eq(matchEnrollments.status, "enrolled")
      )
    );

  // Batch-fetch all ratings for enrolled players in a single query
  const playerIds = enrolledPlayers.map(({ player }) => player.id);
  const allRatings = playerIds.length > 0
    ? await db
        .select({ ratedId: playerRatings.ratedId, skills: playerRatings.skills })
        .from(playerRatings)
        .where(inArray(playerRatings.ratedId, playerIds))
    : [];

  // Group ratings by player
  const ratingsByPlayer = new Map<string, typeof allRatings>();
  for (const r of allRatings) {
    const existing = ratingsByPlayer.get(r.ratedId) ?? [];
    existing.push(r);
    ratingsByPlayer.set(r.ratedId, existing);
  }

  const playerData: PlayerForLineup[] = enrolledPlayers.map(({ player }) => {
    const ratings = ratingsByPlayer.get(player.id) ?? [];

    let avgSkills: Record<string, number> = player.selfSkills as Record<
      string,
      number
    >;

    if (ratings.length > 0) {
      avgSkills = {};
      for (const skill of SKILLS) {
        const values = ratings
          .map((r) => (r.skills as Record<string, number>)[skill])
          .filter((v) => v != null);
        avgSkills[skill] =
          values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : ((player.selfSkills as Record<string, number>)[skill] ?? 3);
      }
    }

    const avgRating =
      Object.values(avgSkills).reduce((a, b) => a + b, 0) /
      Object.values(avgSkills).length;

    return {
      id: player.id,
      name: player.name,
      positions: (player.positions as string[]) || [],
      dominantFoot: player.dominantFoot,
      skills: avgSkills,
      avgRating: Math.round(avgRating * 10) / 10,
    };
  });

  // Generate lineup via Claude
  const lineupMode = mode === "single" ? "single" : "both";
  const result = await generateLineup({
    format: match.format,
    players: playerData,
    mode: lineupMode,
    formation: formation || undefined,
    lockedPlayers,
  });

  // Save lineup
  const teamB = result.team_b
    ? {
        formation: result.team_b.formation,
        players: result.team_b.players.map((p) => ({
          playerId: p.id,
          name: p.name,
          position: p.position,
        })),
      }
    : { formation: "", players: [] };

  const [lineup] = await db
    .insert(lineups)
    .values({
      matchId,
      teamA: {
        formation: result.team_a.formation,
        players: result.team_a.players.map((p) => ({
          playerId: p.id,
          name: p.name,
          position: p.position,
        })),
      },
      teamB: teamB,
      bench: result.bench.map((p) => ({ playerId: p.id, name: p.name })),
      justification: result.justification,
    })
    .returning();

  return NextResponse.json(lineup, { status: 201 });
}
