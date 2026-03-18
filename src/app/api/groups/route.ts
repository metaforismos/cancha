import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { getPlayerGroups } from "@/lib/db/queries";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerGroups = await getPlayerGroups(session.player.id);
  return NextResponse.json(playerGroups);
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createGroupSchema.safeParse(body);

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
