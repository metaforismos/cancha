import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlayerAvgSkills, getRatingByPair, getPlayerRatingsWithRaters } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
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

  const individualRatings = await getPlayerRatingsWithRaters(id);

  return NextResponse.json({
    player,
    avgSkills,
    myRating,
    isMe,
    individualRatings,
  });
}
