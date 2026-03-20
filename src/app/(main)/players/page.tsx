"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, POSITION_LABELS } from "@/types";
import { PlayerCardSkeleton } from "@/components/skeleton-cards";
import type { Position } from "@/types";

interface PlayerData {
  id: string;
  name: string;
  positions: string[];
  selfSkills?: Record<string, number>;
  combinedScore?: number | null;
  ratingCount?: number;
}

interface Club {
  id: string;
  name: string;
}

function getScore(player: PlayerData): number | null {
  return player.combinedScore ?? null;
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [posFilter, setPosFilter] = useState<Position | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubsLoaded, setClubsLoaded] = useState(false);

  // Fetch user's clubs on mount
  useEffect(() => {
    fetch("/api/groups?my=true")
      .then((r) => r.json())
      .then((data) => {
        const myClubs = Array.isArray(data) ? data : [];
        setClubs(myClubs);
        if (myClubs.length > 0) {
          setSelectedClubId(myClubs[0].id);
        }
        setClubsLoaded(true);
      })
      .catch(() => setClubsLoaded(true));
  }, []);

  const fetchPlayers = useCallback((q: string, groupId: string | null) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (groupId) params.set("groupId", groupId);
    fetch(`/api/players?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPlayers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch players when club selection or search changes
  useEffect(() => {
    if (!clubsLoaded) return;
    const timeout = setTimeout(() => fetchPlayers(search, selectedClubId), 300);
    return () => clearTimeout(timeout);
  }, [search, selectedClubId, clubsLoaded, fetchPlayers]);

  // Filter by position and sort by score desc
  const filteredPlayers = useMemo(() => {
    let list = players;
    if (posFilter) {
      list = list.filter((p) => p.positions?.includes(posFilter));
    }
    return [...list].sort((a, b) => {
      const scoreA = getScore(a) ?? -1;
      const scoreB = getScore(b) ?? -1;
      return scoreB - scoreA;
    });
  }, [players, posFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jugadores</h1>

      {/* Club filter tabs */}
      {clubs.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {clubs.map((club) => (
            <Badge
              key={club.id}
              variant={selectedClubId === club.id ? "default" : "outline"}
              className={`cursor-pointer text-xs min-h-[36px] px-3 py-1.5 ${selectedClubId === club.id ? "bg-green-600" : ""}`}
              onClick={() => setSelectedClubId(club.id)}
              role="button"
              aria-pressed={selectedClubId === club.id}
            >
              {club.name}
            </Badge>
          ))}
        </div>
      )}

      <Input
        placeholder="Buscar jugadores..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Position filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge
          variant={posFilter === null ? "default" : "outline"}
          className={`cursor-pointer text-xs min-h-[36px] px-3 py-1.5 ${posFilter === null ? "bg-green-600" : ""}`}
          onClick={() => setPosFilter(null)}
          role="button"
          aria-pressed={posFilter === null}
        >
          Todos
        </Badge>
        {POSITIONS.map((pos) => (
          <Badge
            key={pos}
            variant={posFilter === pos ? "default" : "outline"}
            className={`cursor-pointer text-xs min-h-[36px] px-3 py-1.5 ${posFilter === pos ? "bg-green-600" : ""}`}
            onClick={() => setPosFilter(posFilter === pos ? null : pos)}
            role="button"
            aria-pressed={posFilter === pos}
          >
            {POSITION_LABELS[pos]}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <PlayerCardSkeleton />
            <PlayerCardSkeleton />
            <PlayerCardSkeleton />
            <PlayerCardSkeleton />
            <PlayerCardSkeleton />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium">No se encontraron jugadores</p>
            <p className="text-sm">
              {search || posFilter
                ? "Intenta con otros filtros"
                : "Únete a un club para ver jugadores"}
            </p>
          </div>
        ) : (
          filteredPlayers.map((player, idx) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card className="mb-2 py-0">
                <CardContent className="flex items-center gap-3 px-4 py-2">
                  <span className="text-xs text-muted-foreground w-5 text-right">
                    {idx + 1}
                  </span>
                  <Avatar>
                    <AvatarFallback className="bg-green-600 text-white">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    <div className="flex gap-1 flex-wrap">
                      {(player.positions as string[])?.map((pos) => (
                        <Badge
                          key={pos}
                          variant="secondary"
                          className="text-xs"
                        >
                          {POSITION_LABELS[pos as Position] ?? pos}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {getScore(player) !== null && (
                    <span className="text-sm font-bold text-green-500">
                      {getScore(player)}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
