import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { playerRatings } from "@/lib/db/schema";
import { ratingSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ratingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.ratedId === session.player.id) {
    return NextResponse.json(
      { error: "Cannot rate yourself" },
      { status: 400 }
    );
  }

  // Upsert rating
  const existing = await db
    .select()
    .from(playerRatings)
    .where(
      and(
        eq(playerRatings.raterId, session.player.id),
        eq(playerRatings.ratedId, parsed.data.ratedId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(playerRatings)
      .set({
        skills: parsed.data.skills,
        updatedAt: new Date(),
      })
      .where(eq(playerRatings.id, existing[0].id));
  } else {
    await db.insert(playerRatings).values({
      raterId: session.player.id,
      ratedId: parsed.data.ratedId,
      skills: parsed.data.skills,
    });
  }

  return NextResponse.json({ success: true });
}
