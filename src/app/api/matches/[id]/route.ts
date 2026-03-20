import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatchWithEnrollments, isGroupAdmin, getPlayerAvgSkills, autoUpdateMatchStatus } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Auto-update match status based on time
  await autoUpdateMatchStatus(id);

  const result = await getMatchWithEnrollments(id);

  if (!result) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const canEdit =
    session.player.isAdmin ||
    (await isGroupAdmin(result.match.groupId, session.player.id));

  const avgSkills = await getPlayerAvgSkills(session.player.id);
  const ratingCount = avgSkills?.ratingCount ?? 0;

  // Check if stats can be recorded:
  // Match must be in_progress OR completed within last 24h
  const now = new Date();
  const endTime = result.match.endTime ? new Date(result.match.endTime) : null;
  const canRecordStats =
    result.match.status === "in_progress" ||
    (result.match.status === "completed" &&
      endTime &&
      now.getTime() - endTime.getTime() < 24 * 60 * 60 * 1000);

  return NextResponse.json({
    ...result,
    currentUserId: session.player.id,
    canEdit,
    ratingCount,
    canRecordStats: !!canRecordStats,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const canEdit =
    session.player.isAdmin ||
    (await isGroupAdmin(match.groupId, session.player.id));

  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.date !== undefined) updateData.date = new Date(body.date);
  if (body.endTime !== undefined) updateData.endTime = body.endTime ? new Date(body.endTime) : null;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.locationUrl !== undefined) updateData.locationUrl = body.locationUrl || null;
  if (body.format !== undefined) updateData.format = body.format;
  if (body.maxPlayers !== undefined) updateData.maxPlayers = body.maxPlayers;
  if (body.enrollmentDeadline !== undefined) updateData.enrollmentDeadline = new Date(body.enrollmentDeadline);
  if (body.status !== undefined) updateData.status = body.status;
  if (body.teamAName !== undefined) updateData.teamAName = body.teamAName || null;
  if (body.teamBName !== undefined) updateData.teamBName = body.teamBName || null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(matches)
    .set(updateData)
    .where(eq(matches.id, id))
    .returning();

  return NextResponse.json(updated);
}
