import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isPlayerInClub, joinClub, leaveClub } from "@/lib/db/queries";

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
