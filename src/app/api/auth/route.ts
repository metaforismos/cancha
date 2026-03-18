import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession } from "@/lib/auth";
import { z } from "zod";

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "El número debe tener al menos 10 dígitos")
    .regex(/^\+?\d{10,15}$/, "Formato de número inválido"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = phoneSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Normalize phone: strip spaces/dashes, ensure + prefix
  let phone = parsed.data.phone.replace(/[\s\-()]/g, "");
  if (!phone.startsWith("+")) phone = `+${phone}`;

  // Find or create player
  let [player] = await db
    .select()
    .from(players)
    .where(eq(players.phone, phone))
    .limit(1);

  let isNewPlayer = false;

  if (!player) {
    isNewPlayer = true;
    [player] = await db
      .insert(players)
      .values({
        phone,
        name: "",
        positions: [],
        dominantFoot: "right",
        selfSkills: {},
      })
      .returning();
  }

  await createSession(player.id);

  const needsProfile = !player.name;

  return NextResponse.json(
    { playerId: player.id, isNewPlayer, needsProfile },
    { status: 200 }
  );
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
