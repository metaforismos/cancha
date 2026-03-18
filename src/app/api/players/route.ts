import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { upsertPlayer, getPlayerByAuthId, searchPlayers } from "@/lib/db/queries";
import { playerProfileSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") || "";
  const groupId = request.nextUrl.searchParams.get("groupId") || undefined;

  const results = await searchPlayers(query, groupId);
  return NextResponse.json(results);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = playerProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await upsertPlayer(user.id, {
    phone: user.phone || "",
    name: parsed.data.name,
    positions: parsed.data.positions,
    dominantFoot: parsed.data.dominantFoot,
    selfSkills: parsed.data.selfSkills,
  });

  const player = await getPlayerByAuthId(user.id);
  return NextResponse.json(player);
}
