import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { upsertPlayer, getPlayerByAuthId, searchPlayers } from "@/lib/db/queries";
import { playerProfileSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") || "";
  const groupId = request.nextUrl.searchParams.get("groupId") || undefined;

  const results = await searchPlayers(query, groupId);
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = playerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await upsertPlayer(session.player.id, {
    phone: session.player.phone,
    name: parsed.data.name,
    alias: parsed.data.alias,
    shirtNumber: parsed.data.shirtNumber,
    birthDate: parsed.data.birthDate,
    positions: parsed.data.positions,
    dominantFoot: parsed.data.dominantFoot,
    selfSkills: parsed.data.selfSkills,
  });

  const player = await getPlayerByAuthId(session.player.id);
  return NextResponse.json(player);
}
