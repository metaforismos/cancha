import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import {
  getClubById,
  getGroupMembers,
  isGroupAdmin,
  isPlayerInClub,
} from "@/lib/db/queries";
import { clubUpdateSchema } from "@/lib/validators";
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
  const club = await getClubById(id);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const members = await getGroupMembers(id);
  const isMember = await isPlayerInClub(id, session.player.id);
  const isAdmin = session.player.isAdmin || await isGroupAdmin(id, session.player.id);

  return NextResponse.json({
    ...club,
    members,
    isMember,
    isAdmin,
    isSuperAdmin: session.player.isAdmin,
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
  const isAdmin = await isGroupAdmin(id, session.player.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = clubUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.city !== undefined) updateData.city = parsed.data.city;
  if (parsed.data.country !== undefined)
    updateData.country = parsed.data.country;
  if (parsed.data.description !== undefined)
    updateData.description = parsed.data.description || null;
  if (parsed.data.logoUrl !== undefined)
    updateData.logoUrl = parsed.data.logoUrl || null;

  const [updated] = await db
    .update(groups)
    .set(updateData)
    .where(eq(groups.id, id))
    .returning();

  return NextResponse.json(updated);
}
