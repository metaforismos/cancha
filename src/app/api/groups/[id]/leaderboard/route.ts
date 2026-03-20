import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: groupId } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  // Build date filter for "month" period
  const dateFilter =
    period === "month"
      ? sql`AND m.date >= date_trunc('month', CURRENT_DATE)`
      : sql``;

  // Goals leaderboard
  const goals = await db.execute<{
    playerId: string;
    name: string;
    count: number;
  }>(sql`
    SELECT me.player_id as "playerId", p.name, COUNT(*)::int as count
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN players p ON p.id = me.player_id
    WHERE m.group_id = ${groupId}
      AND me.type = 'goal'
      ${dateFilter}
    GROUP BY me.player_id, p.name
    ORDER BY count DESC
    LIMIT 10
  `);

  // Assists leaderboard
  const assists = await db.execute<{
    playerId: string;
    name: string;
    count: number;
  }>(sql`
    SELECT me.player_id as "playerId", p.name, COUNT(*)::int as count
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN players p ON p.id = me.player_id
    WHERE m.group_id = ${groupId}
      AND me.type = 'assist'
      ${dateFilter}
    GROUP BY me.player_id, p.name
    ORDER BY count DESC
    LIMIT 10
  `);

  // MVPs leaderboard
  const mvps = await db.execute<{
    playerId: string;
    name: string;
    count: number;
  }>(sql`
    SELECT me.player_id as "playerId", p.name, COUNT(*)::int as count
    FROM match_events me
    JOIN matches m ON m.id = me.match_id
    JOIN players p ON p.id = me.player_id
    WHERE m.group_id = ${groupId}
      AND me.type = 'mvp_vote'
      ${dateFilter}
    GROUP BY me.player_id, p.name
    ORDER BY count DESC
    LIMIT 10
  `);

  // Matches played leaderboard
  const matchesPlayed = await db.execute<{
    playerId: string;
    name: string;
    count: number;
  }>(sql`
    SELECT me.player_id as "playerId", p.name, COUNT(*)::int as count
    FROM match_enrollments me
    JOIN matches m ON m.id = me.match_id
    JOIN players p ON p.id = me.player_id
    WHERE m.group_id = ${groupId}
      AND me.status = 'enrolled'
      AND m.status = 'completed'
      ${dateFilter}
    GROUP BY me.player_id, p.name
    ORDER BY count DESC
    LIMIT 10
  `);

  return NextResponse.json({
    goals,
    assists,
    mvps,
    matchesPlayed,
  });
}
