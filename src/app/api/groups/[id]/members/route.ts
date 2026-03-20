import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  isPlayerInClub,
  joinClub,
  leaveClub,
  getPlayerByPhone,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const already = await isPlayerInClub(id, session.player.id);
  if (already) {
    return NextResponse.json(
      { error: "Ya eres miembro de este club" },
      { status: 400 }
    );
  }

  await joinClub(id, session.player.id);
  return NextResponse.json({ success: true }, { status: 201 });
}

// Super admin: add a player to the club by phone number
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.player.isAdmin) {
    return NextResponse.json({ error: "Solo administradores pueden agregar jugadores" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  let phone = (body.phone || "").replace(/[\s\-()]/g, "");
  if (!phone.startsWith("+")) phone = `+${phone}`;

  if (!/^\+\d{10,15}$/.test(phone)) {
    return NextResponse.json({ error: "Número de teléfono inválido" }, { status: 400 });
  }

  // Find or create the player
  let player = await getPlayerByPhone(phone);
  if (!player) {
    // Create a stub player with just the phone
    const [newPlayer] = await db
      .insert(players)
      .values({
        phone,
        name: "",
        positions: [],
        dominantFoot: "right",
        selfSkills: {},
      })
      .returning();
    player = newPlayer;
  }

  // Check if already a member
  const already = await isPlayerInClub(id, player.id);
  if (already) {
    return NextResponse.json(
      { error: "Este jugador ya es miembro del club" },
      { status: 400 }
    );
  }

  await joinClub(id, player.id);
  return NextResponse.json(
    { success: true, playerName: player.name || phone },
    { status: 201 }
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await leaveClub(id, session.player.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}
