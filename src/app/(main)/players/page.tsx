"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, POSITION_LABELS } from "@/types";
import type { Position } from "@/types";

interface PlayerData {
  id: string;
  name: string;
  positions: string[];
  selfSkills?: Record<string, number>;
}

function getOverall(skills?: Record<string, number>): number | null {
  if (!skills || Object.keys(skills).length === 0) return null;
  const vals = Object.values(skills);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [posFilter, setPosFilter] = useState<Position | null>(null);

  const fetchPlayers = useCallback((q: string) => {
    setLoading(true);
    fetch(`/api/players?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        const normalized = Array.isArray(data)
          ? data.map((d: PlayerData | { player: PlayerData }) =>
              "player" in d ? d.player : d
            )
          : [];
        setPlayers(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPlayers("");
  }, [fetchPlayers]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchPlayers(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchPlayers]);

  // Filter by position and sort by score desc
  const filteredPlayers = useMemo(() => {
    let list = players;
    if (posFilter) {
      list = list.filter((p) => p.positions?.includes(posFilter));
    }
    return [...list].sort((a, b) => {
      const scoreA = getOverall(a.selfSkills) ?? -1;
      const scoreB = getOverall(b.selfSkills) ?? -1;
      return scoreB - scoreA;
    });
  }, [players, posFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jugadores</h1>

      <Input
        placeholder="Buscar jugadores..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Position filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge
          variant={posFilter === null ? "default" : "outline"}
          className={`cursor-pointer text-xs ${posFilter === null ? "bg-green-600" : ""}`}
          onClick={() => setPosFilter(null)}
        >
          Todos
        </Badge>
        {POSITIONS.map((pos) => (
          <Badge
            key={pos}
            variant={posFilter === pos ? "default" : "outline"}
            className={`cursor-pointer text-xs ${posFilter === pos ? "bg-green-600" : ""}`}
            onClick={() => setPosFilter(posFilter === pos ? null : pos)}
          >
            {POSITION_LABELS[pos]}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Cargando...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium">No se encontraron jugadores</p>
            <p className="text-sm">
              {search || posFilter
                ? "Intenta con otros filtros"
                : "Únete a un grupo para ver jugadores"}
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
                  {getOverall(player.selfSkills) !== null && (
                    <span className="text-sm font-bold text-green-500">
                      {getOverall(player.selfSkills)}
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
