import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { matchEnrollments, matches, players } from "@/lib/db/schema";
import {
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

  const body = await request.json();
  const { matchId } = body;
  // Optional: add another player (club member adding a club member)
  const targetPlayerId: string | undefined = body.playerId;
  const isAddingOther = !!targetPlayerId && targetPlayerId !== session.player.id;

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
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

  // For adding others: match must not be completed
  // For self-enrollment: match must be open
  if (isAddingOther) {
    if (match.status === "completed") {
      return NextResponse.json(
        { error: "No se pueden agregar jugadores a un partido finalizado" },
        { status: 400 }
      );
    }
  } else {
    if (match.status !== "open") {
      return NextResponse.json({ error: "Match is not open" }, { status: 400 });
    }
  }

  const enrollPlayerId = isAddingOther ? targetPlayerId : session.player.id;

  // Club membership checks
  const defaultGroup = await getOrCreateDefaultGroup(session.player.id);
  if (match.groupId !== defaultGroup.id) {
    // Caller must be a member
    const callerIsMember = await isPlayerInClub(match.groupId, session.player.id);
    if (!callerIsMember) {
      return NextResponse.json(
        { error: "Debes unirte al club para inscribirte en este partido" },
        { status: 403 }
      );
    }
    // Target player must also be a member
    if (isAddingOther) {
      const targetIsMember = await isPlayerInClub(match.groupId, targetPlayerId);
      if (!targetIsMember) {
        return NextResponse.json(
          { error: "El jugador debe ser miembro del club" },
          { status: 403 }
        );
      }
    }
  } else if (isAddingOther) {
    // For default group, verify the target player exists and is a member
    const targetIsMember = await isPlayerInClub(match.groupId, targetPlayerId);
    if (!targetIsMember) {
      return NextResponse.json(
        { error: "El jugador debe ser miembro del club" },
        { status: 403 }
      );
    }
  }

  // Check deadline only for self-enrollment
  if (!isAddingOther && new Date() > match.enrollmentDeadline) {
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
        eq(matchEnrollments.playerId, enrollPlayerId)
      )
    )
    .limit(1);

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: "Ya está inscrito en el partido" },
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
          eq(matchEnrollments.playerId, enrollPlayerId)
        )
      );
  } else {
    await db.insert(matchEnrollments).values({
      matchId,
      playerId: enrollPlayerId,
      status,
    });
  }

  // Get the enrolled player's name for notification
  let enrolledPlayerName = session.player.name;
  if (isAddingOther) {
    const [targetPlayer] = await db
      .select({ name: players.name })
      .from(players)
      .where(eq(players.id, targetPlayerId))
      .limit(1);
    enrolledPlayerName = targetPlayer?.name || "Un jugador";
  }

  // Fire-and-forget push notification to match creator
  sendPushToPlayer(match.createdBy, {
    type: "enrollment_update",
    title: "Nueva inscripción",
    body: isAddingOther
      ? `${session.player.name} inscribió a ${enrolledPlayerName} en tu partido`
      : `${session.player.name} se inscribió a tu partido`,
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
