import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { groups, groupMembers } from "@/lib/db/schema";
import { getPlayerGroups } from "@/lib/db/queries";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const playerGroups = await getPlayerGroups(user.id);
  return NextResponse.json(playerGroups);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
      createdBy: user.id,
    })
    .returning();

  // Add creator as admin
  await db.insert(groupMembers).values({
    groupId: group.id,
    playerId: user.id,
    role: "admin",
  });

  return NextResponse.json(group, { status: 201 });
}
