import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { matchEnrollments, matches } from "@/lib/db/schema";
import { getEnrollmentCount, getPlayerAvgSkills } from "@/lib/db/queries";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  // Check rating gate: need ≥3 ratings
  const avgSkills = await getPlayerAvgSkills(user.id);
  if (!avgSkills || avgSkills.ratingCount < 3) {
    return NextResponse.json(
      {
        error: "You need at least 3 ratings from other players before joining matches",
        ratingCount: avgSkills?.ratingCount ?? 0,
      },
      { status: 403 }
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

  if (match.status !== "open") {
    return NextResponse.json({ error: "Match is not open" }, { status: 400 });
  }

  // Check deadline
  if (new Date() > match.enrollmentDeadline) {
    return NextResponse.json(
      { error: "Enrollment deadline passed" },
      { status: 400 }
    );
  }

  // Check if already enrolled
  const [existing] = await db
    .select()
    .from(matchEnrollments)
    .where(
      and(
        eq(matchEnrollments.matchId, matchId),
        eq(matchEnrollments.playerId, user.id)
      )
    )
    .limit(1);

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: "Already enrolled" },
      { status: 400 }
    );
  }

  // Determine status
  const enrolledCount = await getEnrollmentCount(matchId);
  const status = enrolledCount >= match.maxPlayers ? "waitlisted" : "enrolled";

  if (existing) {
    await db
      .update(matchEnrollments)
      .set({ status, joinedAt: new Date() })
      .where(
        and(
          eq(matchEnrollments.matchId, matchId),
          eq(matchEnrollments.playerId, user.id)
        )
      );
  } else {
    await db.insert(matchEnrollments).values({
      matchId,
      playerId: user.id,
      status,
    });
  }

  return NextResponse.json({ status }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await request.json();

  // Mark as removed
  await db
    .update(matchEnrollments)
    .set({ status: "removed" })
    .where(
      and(
        eq(matchEnrollments.matchId, matchId),
        eq(matchEnrollments.playerId, user.id)
      )
    );

  // Auto-promote first waitlisted player
  const [nextWaitlisted] = await db
    .select()
    .from(matchEnrollments)
    .where(
      and(
        eq(matchEnrollments.matchId, matchId),
        eq(matchEnrollments.status, "waitlisted")
      )
    )
    .orderBy(matchEnrollments.joinedAt)
    .limit(1);

  if (nextWaitlisted) {
    await db
      .update(matchEnrollments)
      .set({ status: "enrolled" })
      .where(
        and(
          eq(matchEnrollments.matchId, matchId),
          eq(matchEnrollments.playerId, nextWaitlisted.playerId)
        )
      );
  }

  return NextResponse.json({ success: true });
}
