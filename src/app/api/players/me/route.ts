import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlayerByAuthId, getPlayerAvgSkills, getPlayerGroups } from "@/lib/db/queries";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await getPlayerByAuthId(user.id);

  if (!player) {
    return NextResponse.json({ player: null, needsProfile: true });
  }

  const avgSkills = await getPlayerAvgSkills(user.id);
  const groups = await getPlayerGroups(user.id);

  return NextResponse.json({
    player,
    avgSkills,
    groups,
    needsProfile: false,
  });
}
