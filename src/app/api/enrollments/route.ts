import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { matchEnrollments, matches } from "@/lib/db/schema";
import {
  getPlayerAvgSkills,
  getOrCreateDefaultGroup,
  isPlayerInClub,
} from "@/lib/db/queries";
import { eq, and, sql } from "drizzle-orm";
import { sendPushToPlayer } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await request.json();

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  // Check rating gate: need ≥3 ratings
  const avgSkills = await getPlayerAvgSkills(session.player.id);
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

  // Club membership check: if match belongs to a non-default club, verify membership
  const defaultGroup = await getOrCreateDefaultGroup(session.player.id);
  if (match.groupId !== defaultGroup.id) {
    const isMember = await isPlayerInClub(match.groupId, session.player.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "Debes unirte al club para inscribirte en este partido" },
        { status: 403 }
      );
    }
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
        eq(matchEnrollments.playerId, session.player.id)
      )
    )
    .limit(1);

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: "Already enrolled" },
      { status: 400 }
    );
  }

  // Enforce maxPlayers — waitlist if full
  let status: "enrolled" | "waitlisted" = "enrolled";
  if (match.maxPlayers && match.maxPlayers < 999) {
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(matchEnrollments)
      .where(
        and(
          eq(matchEnrollments.matchId, matchId),
          eq(matchEnrollments.status, "enrolled")
        )
      );
    if ((countResult?.count ?? 0) >= match.maxPlayers) {
      status = "waitlisted";
    }
  }

  if (existing) {
    await db
      .update(matchEnrollments)
      .set({ status, joinedAt: new Date() })
      .where(
        and(
          eq(matchEnrollments.matchId, matchId),
          eq(matchEnrollments.playerId, session.player.id)
        )
      );
  } else {
    await db.insert(matchEnrollments).values({
      matchId,
      playerId: session.player.id,
      status,
    });
  }

  // Fire-and-forget push notification to match creator
  sendPushToPlayer(match.createdBy, {
    type: "enrollment_update",
    title: "Nueva inscripción",
    body: `${session.player.name} se inscribió a tu partido`,
    url: `/matches/${matchId}`,
    matchId,
  }).catch(() => {});

  return NextResponse.json({ status }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();

  if (!session) {
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
        eq(matchEnrollments.playerId, session.player.id)
      )
    );

  return NextResponse.json({ success: true });
}
