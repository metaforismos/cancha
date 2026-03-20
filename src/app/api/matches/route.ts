import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, matchEnrollments } from "@/lib/db/schema";
import { matchCreateSchema } from "@/lib/validators";
import { desc, eq, sql, and, count } from "drizzle-orm";
import { ensurePlayerInDefaultGroup } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Use LEFT JOIN + GROUP BY instead of correlated subquery
  const conditions = [
    sql`(${matchEnrollments.status} = 'enrolled' OR ${matchEnrollments.status} IS NULL)`,
  ];
  if (groupId) {
    conditions.push(eq(matches.groupId, groupId));
  }

  const result = await db
    .select({
      id: matches.id,
      date: matches.date,
      endTime: matches.endTime,
      location: matches.location,
      locationUrl: matches.locationUrl,
      format: matches.format,
      category: matches.category,
      maxPlayers: matches.maxPlayers,
      status: matches.status,
      teamAName: matches.teamAName,
      teamBName: matches.teamBName,
      enrollmentDeadline: matches.enrollmentDeadline,
      enrolledCount: sql<number>`count(${matchEnrollments.playerId})`.as("enrolled_count"),
    })
    .from(matches)
    .leftJoin(
      matchEnrollments,
      and(
        eq(matchEnrollments.matchId, matches.id),
        eq(matchEnrollments.status, "enrolled")
      )
    )
    .where(groupId ? eq(matches.groupId, groupId) : undefined)
    .groupBy(matches.id)
    .orderBy(desc(matches.date))
    .limit(limit)
    .offset(offset);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = matchCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Auto-use default group for match creation
  const defaultGroup = await ensurePlayerInDefaultGroup(session.player.id);

  const [match] = await db
    .insert(matches)
    .values({
      groupId: parsed.data.groupId || defaultGroup.id,
      date: new Date(parsed.data.date),
      endTime: new Date(parsed.data.endTime),
      location: parsed.data.location,
      locationUrl: parsed.data.locationUrl || null,
      format: parsed.data.format,
      category: parsed.data.category || "friendly",
      teamAName: parsed.data.teamAName || null,
      teamBName: parsed.data.teamBName || null,
      maxPlayers: parsed.data.maxPlayers ?? 999,
      enrollmentDeadline: new Date(parsed.data.enrollmentDeadline),
      createdBy: session.player.id,
    })
    .returning({ id: matches.id });

  return NextResponse.json({ id: match.id }, { status: 201 });
}
