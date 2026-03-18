"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PlayerData {
  id: string;
  name: string;
  positions: string[];
}

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback((q: string) => {
    setLoading(true);
    fetch(`/api/players?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        // Handle both formats from searchPlayers
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Jugadores</h1>

      <Input
        placeholder="Buscar jugadores..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Cargando...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium">No se encontraron jugadores</p>
            <p className="text-sm">
              {search ? "Intenta otra búsqueda" : "Únete a un grupo para ver jugadores"}
            </p>
          </div>
        ) : (
          players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card className="mb-2">
                <CardContent className="flex items-center gap-3 py-3">
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
                          {pos}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
