import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMatchLineup } from "@/lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;
  const lineup = await getMatchLineup(matchId);

  if (!lineup) {
    return NextResponse.json(null);
  }

  return NextResponse.json(lineup);
}
