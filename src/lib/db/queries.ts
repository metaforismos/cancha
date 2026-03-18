import { db } from ".";
import {
  players,
  playerRatings,
  groups,
  groupMembers,
  matches,
  matchEnrollments,
  lineups,
  matchResults,
  matchEvents,
} from "./schema";
import { eq, and, desc, sql, ilike, count } from "drizzle-orm";
import { SKILLS } from "@/types";

// ─── Players ─────────────────────────────────────────────

export async function getPlayerByAuthId(authId: string) {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, authId))
    .limit(1);
  return player ?? null;
}

export async function getPlayerByPhone(phone: string) {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.phone, phone))
    .limit(1);
  return player ?? null;
}

export async function upsertPlayer(
  id: string,
  data: {
    phone: string;
    name: string;
    alias?: string | null;
    shirtNumber?: number | null;
    birthDate?: string | null;
    positions: string[];
    dominantFoot: "left" | "right" | "both";
    selfSkills: Record<string, number>;
  }
) {
  const existing = await getPlayerByAuthId(id);

  if (existing) {
    await db
      .update(players)
      .set({
        name: data.name,
        alias: data.alias || null,
        shirtNumber: data.shirtNumber || null,
        birthDate: data.birthDate || null,
        positions: data.positions,
        dominantFoot: data.dominantFoot,
        selfSkills: data.selfSkills,
      })
      .where(eq(players.id, id));
  } else {
    await db.insert(players).values({
      id,
      phone: data.phone,
      name: data.name,
      alias: data.alias || null,
      shirtNumber: data.shirtNumber || null,
      birthDate: data.birthDate || null,
      positions: data.positions,
      dominantFoot: data.dominantFoot,
      selfSkills: data.selfSkills,
    });
  }
}

export async function searchPlayers(query: string, groupId?: string) {
  if (groupId) {
    return db
      .select({ player: players })
      .from(groupMembers)
      .innerJoin(players, eq(groupMembers.playerId, players.id))
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          query ? ilike(players.name, `%${query}%`) : undefined
        )
      );
  }

  return db
    .select()
    .from(players)
    .where(query ? ilike(players.name, `%${query}%`) : undefined)
    .limit(50);
}

// ─── Ratings ─────────────────────────────────────────────

export async function getPlayerRatings(playerId: string) {
  return db
    .select()
    .from(playerRatings)
    .where(eq(playerRatings.ratedId, playerId));
}

export async function getPlayerAvgSkills(playerId: string) {
  const ratings = await getPlayerRatings(playerId);

  if (ratings.length === 0) return null;

  const avgSkills: Record<string, number> = {};
  for (const skill of SKILLS) {
    const values = ratings
      .map((r) => (r.skills as Record<string, number>)[skill])
      .filter((v) => v != null);
    avgSkills[skill] =
      values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : 0;
  }

  return {
    skills: avgSkills,
    ratingCount: ratings.length,
    overall:
      Math.round(
        (Object.values(avgSkills).reduce((a, b) => a + b, 0) /
          Object.values(avgSkills).length) *
          10
      ) / 10,
  };
}

export async function getRatingByPair(raterId: string, ratedId: string) {
  const [rating] = await db
    .select()
    .from(playerRatings)
    .where(
      and(
        eq(playerRatings.raterId, raterId),
        eq(playerRatings.ratedId, ratedId)
      )
    )
    .limit(1);
  return rating ?? null;
}

// ─── Groups ──────────────────────────────────────────────

export async function getPlayerGroups(playerId: string) {
  return db
    .select({ group: groups, role: groupMembers.role })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.playerId, playerId));
}

export async function getGroupMembers(groupId: string) {
  return db
    .select({ player: players, role: groupMembers.role })
    .from(groupMembers)
    .innerJoin(players, eq(groupMembers.playerId, players.id))
    .where(eq(groupMembers.groupId, groupId));
}

export async function isGroupAdmin(groupId: string, playerId: string) {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.playerId, playerId),
        eq(groupMembers.role, "admin")
      )
    )
    .limit(1);
  return !!membership;
}

// ─── Matches ─────────────────────────────────────────────

export async function getGroupMatches(groupId: string) {
  return db
    .select()
    .from(matches)
    .where(eq(matches.groupId, groupId))
    .orderBy(desc(matches.date));
}

export async function getMatch(matchId: string) {
  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  return match ?? null;
}

export async function getMatchWithEnrollments(matchId: string) {
  const match = await getMatch(matchId);
  if (!match) return null;

  const enrollments = await db
    .select({ enrollment: matchEnrollments, player: players })
    .from(matchEnrollments)
    .innerJoin(players, eq(matchEnrollments.playerId, players.id))
    .where(eq(matchEnrollments.matchId, matchId))
    .orderBy(matchEnrollments.joinedAt);

  return { match, enrollments };
}

export async function getEnrollmentCount(matchId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(matchEnrollments)
    .where(
      and(
        eq(matchEnrollments.matchId, matchId),
        eq(matchEnrollments.status, "enrolled")
      )
    );
  return result?.count ?? 0;
}

// ─── Lineups ─────────────────────────────────────────────

export async function getMatchLineup(matchId: string) {
  const [lineup] = await db
    .select()
    .from(lineups)
    .where(eq(lineups.matchId, matchId))
    .orderBy(desc(lineups.createdAt))
    .limit(1);
  return lineup ?? null;
}

// ─── Match Results ───────────────────────────────────────

export async function getMatchResult(matchId: string) {
  const [result] = await db
    .select()
    .from(matchResults)
    .where(eq(matchResults.matchId, matchId))
    .limit(1);
  return result ?? null;
}

export async function getMatchEvents(matchId: string) {
  return db
    .select({ event: matchEvents, player: players })
    .from(matchEvents)
    .innerJoin(players, eq(matchEvents.playerId, players.id))
    .where(eq(matchEvents.matchId, matchId));
}
