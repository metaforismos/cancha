import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPlayerByAuthId, getPlayerAvgSkills, getPlayerGroups } from "@/lib/db/queries";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await getPlayerByAuthId(session.player.id);

  if (!player) {
    return NextResponse.json({ player: null, needsProfile: true });
  }

  const avgSkills = await getPlayerAvgSkills(session.player.id);
  const groups = await getPlayerGroups(session.player.id);

  return NextResponse.json({
    player,
    avgSkills,
    groups,
    needsProfile: false,
  });
}
