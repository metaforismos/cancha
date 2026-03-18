import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatchWithEnrollments } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getMatchWithEnrollments(id);

  if (!result) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...result,
    currentUserId: session.player.id,
  });
}
