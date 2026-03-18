import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, matchEnrollments, groupMembers } from "@/lib/db/schema";
import { matchCreateSchema } from "@/lib/validators";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get("groupId");
  if (!groupId) {
    return NextResponse.json({ error: "groupId required" }, { status: 400 });
  }

  const result = await db
    .select({
      id: matches.id,
      date: matches.date,
      location: matches.location,
      locationUrl: matches.locationUrl,
      format: matches.format,
      maxPlayers: matches.maxPlayers,
      status: matches.status,
      enrollmentDeadline: matches.enrollmentDeadline,
      enrolledCount: sql<number>`(
        SELECT count(*) FROM match_enrollments
        WHERE match_enrollments.match_id = ${matches.id}
        AND match_enrollments.status = 'enrolled'
      )`.as("enrolled_count"),
    })
    .from(matches)
    .where(eq(matches.groupId, groupId))
    .orderBy(desc(matches.date));

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

  // Verify user is admin of the group
  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, parsed.data.groupId),
        eq(groupMembers.playerId, session.player.id),
        eq(groupMembers.role, "admin")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      { error: "Only group admins can create matches" },
      { status: 403 }
    );
  }

  const [match] = await db
    .insert(matches)
    .values({
      groupId: parsed.data.groupId,
      date: new Date(parsed.data.date),
      location: parsed.data.location,
      locationUrl: parsed.data.locationUrl || null,
      format: parsed.data.format,
      maxPlayers: parsed.data.maxPlayers,
      enrollmentDeadline: new Date(parsed.data.enrollmentDeadline),
      createdBy: session.player.id,
    })
    .returning({ id: matches.id });

  return NextResponse.json({ id: match.id }, { status: 201 });
}
