import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { matches, matchEnrollments } from "@/lib/db/schema";
import { matchCreateSchema } from "@/lib/validators";
import { desc, sql } from "drizzle-orm";
import { ensurePlayerInDefaultGroup } from "@/lib/db/queries";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Auto-use default group for match creation
  const defaultGroup = await ensurePlayerInDefaultGroup(session.player.id);

  const [match] = await db
    .insert(matches)
    .values({
      groupId: parsed.data.groupId || defaultGroup.id,
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
