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
import { eq, ne, and, desc, sql, ilike, count, inArray } from "drizzle-orm";
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
  // Always exclude players who haven't completed their profile (empty name)
  const hasName = ne(players.name, "");

  if (groupId) {
    return db
      .select({ player: players })
      .from(groupMembers)
      .innerJoin(players, eq(groupMembers.playerId, players.id))
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          hasName,
          query ? ilike(players.name, `%${query}%`) : undefined
        )
      );
  }

  return db
    .select()
    .from(players)
    .where(and(hasName, query ? ilike(players.name, `%${query}%`) : undefined))
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

/**
 * Batch version of getPlayerAvgSkills — single query for all players.
 * Returns a Map keyed by playerId.
 */
export async function getPlayerAvgSkillsBatch(playerIds: string[]) {
  if (playerIds.length === 0) return new Map<string, { skills: Record<string, number>; ratingCount: number; overall: number }>();

  const ratings = await db
    .select()
    .from(playerRatings)
    .where(inArray(playerRatings.ratedId, playerIds));

  // Group by ratedId
  const byPlayer = new Map<string, typeof ratings>();
  for (const r of ratings) {
    const existing = byPlayer.get(r.ratedId) ?? [];
    existing.push(r);
    byPlayer.set(r.ratedId, existing);
  }

  const result = new Map<string, { skills: Record<string, number>; ratingCount: number; overall: number }>();

  for (const [playerId, playerRatings_] of byPlayer) {
    const avgSkills: Record<string, number> = {};
    for (const skill of SKILLS) {
      const values = playerRatings_
        .map((r) => (r.skills as Record<string, number>)[skill])
        .filter((v) => v != null);
      avgSkills[skill] =
        values.length > 0
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : 0;
    }

    result.set(playerId, {
      skills: avgSkills,
      ratingCount: playerRatings_.length,
      overall:
        Math.round(
          (Object.values(avgSkills).reduce((a, b) => a + b, 0) /
            Object.values(avgSkills).length) *
            10
        ) / 10,
    });
  }

  return result;
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

export async function getPlayerRatingsWithRaters(playerId: string) {
  return db
    .select({
      rater: { id: players.id, name: players.name },
      skills: playerRatings.skills,
      createdAt: playerRatings.createdAt,
    })
    .from(playerRatings)
    .innerJoin(players, eq(playerRatings.raterId, players.id))
    .where(eq(playerRatings.ratedId, playerId));
}

// ─── Default Group ──────────────────────────────────────

const DEFAULT_GROUP_NAME = "Cancha";

export async function getOrCreateDefaultGroup(creatorId: string) {
  // Find existing default group
  const [existing] = await db
    .select()
    .from(groups)
    .where(eq(groups.name, DEFAULT_GROUP_NAME))
    .limit(1);

  if (existing) return existing;

  // Create default group
  const [group] = await db
    .insert(groups)
    .values({ name: DEFAULT_GROUP_NAME, createdBy: creatorId })
    .returning();

  // Make creator admin
  await db.insert(groupMembers).values({
    groupId: group.id,
    playerId: creatorId,
    role: "admin",
  });

  return group;
}

export async function ensurePlayerInDefaultGroup(playerId: string) {
  const group = await getOrCreateDefaultGroup(playerId);

  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, group.id),
        eq(groupMembers.playerId, playerId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(groupMembers).values({
      groupId: group.id,
      playerId: playerId,
      role: "player",
    });
  }

  return group;
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
  // Super admins (players.isAdmin) bypass group-level check
  const [player] = await db
    .select({ isAdmin: players.isAdmin })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);
  if (player?.isAdmin) return true;

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

// ─── Clubs ──────────────────────────────────────────────

export async function getAllClubs(filters?: {
  city?: string;
  country?: string;
}) {
  const conditions = [];
  if (filters?.city) {
    conditions.push(ilike(groups.city, filters.city));
  }
  if (filters?.country) {
    conditions.push(ilike(groups.country, filters.country));
  }
  // Exclude default "Cancha" group from clubs listing
  conditions.push(ne(groups.name, DEFAULT_GROUP_NAME));

  const rows = await db
    .select({
      group: groups,
      memberCount: count(groupMembers.playerId),
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(groups.id)
    .orderBy(groups.name);

  return rows;
}

export async function getClubById(groupId: string) {
  const [row] = await db
    .select({
      group: groups,
      memberCount: count(groupMembers.playerId),
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groups.id, groupId))
    .groupBy(groups.id)
    .limit(1);
  return row ?? null;
}

export async function isPlayerInClub(groupId: string, playerId: string) {
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.playerId, playerId)
      )
    )
    .limit(1);
  return !!membership;
}

export async function joinClub(groupId: string, playerId: string) {
  await db.insert(groupMembers).values({
    groupId,
    playerId,
    role: "player",
  });
}

export async function leaveClub(groupId: string, playerId: string) {
  // Check if player is sole admin
  const isAdmin = await isGroupAdmin(groupId, playerId);
  if (isAdmin) {
    const admins = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.role, "admin")
        )
      );
    if (admins.length <= 1) {
      throw new Error("No puedes salir del club siendo el unico administrador");
    }
  }

  await db
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.playerId, playerId)
      )
    );
}

export async function getDistinctClubLocations() {
  const rows = await db
    .selectDistinct({ city: groups.city, country: groups.country })
    .from(groups)
    .where(
      and(
        ne(groups.name, DEFAULT_GROUP_NAME),
        sql`${groups.city} IS NOT NULL`
      )
    );
  return rows;
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
