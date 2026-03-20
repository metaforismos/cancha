import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { getAllClubs, getPlayerGroups } from "@/lib/db/queries";
import { clubCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const my = searchParams.get("my");

  // Return only player's clubs
  if (my === "true") {
    const playerGroups = await getPlayerGroups(session.player.id);
    return NextResponse.json(playerGroups);
  }

  // Return all clubs with filters
  const city = searchParams.get("city") || undefined;
  const country = searchParams.get("country") || undefined;
  const clubs = await getAllClubs({ city, country });
  return NextResponse.json(clubs);
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clubCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [group] = await db
    .insert(groups)
    .values({
      name: parsed.data.name,
      city: parsed.data.city,
      country: parsed.data.country,
      description: parsed.data.description || null,
      logoUrl: parsed.data.logoUrl || null,
      createdBy: session.player.id,
    })
    .returning();

  // Add creator as admin
  await db.insert(groupMembers).values({
    groupId: group.id,
    playerId: session.player.id,
    role: "admin",
  });

  return NextResponse.json(group, { status: 201 });
}
