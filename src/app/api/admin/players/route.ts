import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { z } from "zod";

const createPlayerSchema = z.object({
  phone: z.string().min(8).max(20),
  name: z.string().min(2).max(50),
  alias: z.string().max(30).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  positions: z.array(z.string()).default([]),
  dominantFoot: z.enum(["left", "right", "both"]).default("right"),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.player.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPlayerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Normalize phone: strip spaces/dashes, ensure + prefix
  let phone = parsed.data.phone.replace(/[\s\-()]/g, "");
  if (!phone.startsWith("+")) phone = `+${phone}`;

  const [newPlayer] = await db
    .insert(players)
    .values({
      phone,
      name: parsed.data.name,
      alias: parsed.data.alias || null,
      shirtNumber: parsed.data.shirtNumber || null,
      positions: parsed.data.positions,
      dominantFoot: parsed.data.dominantFoot,
      selfSkills: {},
    })
    .onConflictDoNothing()
    .returning();

  if (!newPlayer) {
    return NextResponse.json(
      { error: "Ya existe un jugador con ese teléfono" },
      { status: 409 }
    );
  }

  return NextResponse.json(newPlayer, { status: 201 });
}
