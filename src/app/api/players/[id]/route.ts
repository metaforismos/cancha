import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlayerAvgSkills, getRatingByPair, getPlayerRatingsWithRaters, upsertPlayer, getPlayerMatchStats } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { playerProfileSchema } from "@/lib/validators";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const avgSkills = await getPlayerAvgSkills(id);
  const myRating = await getRatingByPair(session.player.id, id);
  const isMe = session.player.id === id;
  const canEdit = isMe || session.player.isAdmin;

  const individualRatings = await getPlayerRatingsWithRaters(id);
  const matchStats = await getPlayerMatchStats(id);

  return NextResponse.json({
    player,
    avgSkills,
    myRating,
    isMe,
    canEdit,
    individualRatings,
    matchStats,
  }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
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
  const isMe = session.player.id === id;

  if (!isMe && !session.player.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = playerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await upsertPlayer(id, {
    phone: player.phone,
    name: parsed.data.name,
    alias: parsed.data.alias,
    shirtNumber: parsed.data.shirtNumber,
    birthDate: parsed.data.birthDate,
    positions: parsed.data.positions,
    dominantFoot: parsed.data.dominantFoot,
    selfSkills: parsed.data.selfSkills,
  });

  const updated = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1);

  return NextResponse.json(updated[0]);
}
