import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  upsertPlayer,
  getPlayerByAuthId,
  searchPlayers,
  getPlayerAvgSkillsBatch,
} from "@/lib/db/queries";
import { playerProfileSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q") || "";
  const groupId = request.nextUrl.searchParams.get("groupId") || undefined;

  const results = await searchPlayers(query, groupId);

  // Enrich each player with combined average (self + peer ratings)
  const normalized = results.map((r: { player?: unknown }) =>
    "player" in r ? (r as { player: Record<string, unknown> }).player : r
  ) as Record<string, unknown>[];

  // Batch fetch all peer ratings in a single query (fixes N+1)
  const playerIds = normalized.map((p) => p.id as string);
  const peerAvgMap = await getPlayerAvgSkillsBatch(playerIds);

  const enriched = normalized.map((player) => {
    const peerAvg = peerAvgMap.get(player.id as string) ?? null;
    const selfSkills = player.selfSkills as Record<string, number> | undefined;

    // Compute self overall
    let selfOverall: number | null = null;
    if (selfSkills && Object.keys(selfSkills).length > 0) {
      const vals = Object.values(selfSkills);
      selfOverall = vals.reduce((a, b) => a + b, 0) / vals.length;
    }

    // Combined average: treat self-rating and each peer rating equally
    let combinedScore: number | null = null;
    if (peerAvg && selfOverall != null) {
      const totalRaters = peerAvg.ratingCount + 1;
      combinedScore =
        Math.round(
          ((selfOverall + peerAvg.overall * peerAvg.ratingCount) / totalRaters) * 10
        ) / 10;
    } else if (peerAvg) {
      combinedScore = peerAvg.overall;
    } else if (selfOverall != null) {
      combinedScore = Math.round(selfOverall * 10) / 10;
    }

    return {
      ...player,
      combinedScore,
      ratingCount: (peerAvg?.ratingCount ?? 0) + (selfOverall != null ? 1 : 0),
    };
  });

  return NextResponse.json(enriched);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session) {
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

  await upsertPlayer(session.player.id, {
    phone: session.player.phone,
    name: parsed.data.name,
    alias: parsed.data.alias,
    shirtNumber: parsed.data.shirtNumber,
    birthDate: parsed.data.birthDate,
    positions: parsed.data.positions,
    dominantFoot: parsed.data.dominantFoot,
    selfSkills: parsed.data.selfSkills,
  });

  const player = await getPlayerByAuthId(session.player.id);
  return NextResponse.json(player);
}
