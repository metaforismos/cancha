"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MatchData {
  id: string;
  date: string;
  location: string;
  format: string;
  status: string;
  maxPlayers: number;
  enrolledCount?: number;
}

export function MatchFeed({ userId }: { userId?: string }) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<
    { group: { id: string; name: string } }[]
  >([]);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setLoading(false);
          return;
        }
        setGroups(data);
        if (data.length > 0) {
          return fetch(`/api/matches?groupId=${data[0].group.id}`);
        }
        setLoading(false);
        return null;
      })
      .then((r) => {
        if (r) return r.json();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Cargando...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <div className="text-4xl mb-3">⚽</div>
        <p className="text-lg font-medium">Sin grupos aún</p>
        <p className="text-sm mb-4">
          Crea un grupo para empezar a programar partidos
        </p>
        <CreateGroupButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/matches/new">
        <Button className="w-full bg-green-600 hover:bg-green-700">
          Crear partido
        </Button>
      </Link>
      {matches.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p className="text-sm">Sin partidos aún — crea el primero</p>
        </div>
      ) : (
        matches.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <MatchCard match={match} />
          </Link>
        ))
      )}
    </div>
  );
}

function CreateGroupButton() {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name) return;
    setCreating(true);
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    window.location.reload();
  }

  return (
    <div className="flex gap-2 max-w-xs mx-auto">
      <input
        placeholder="Nombre del grupo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <Button
        onClick={handleCreate}
        disabled={creating || !name}
        className="bg-green-600 hover:bg-green-700"
      >
        {creating ? "..." : "Crear"}
      </Button>
    </div>
  );
}

function MatchCard({ match }: { match: MatchData }) {
  const statusColors: Record<string, string> = {
    open: "bg-green-600",
    closed: "bg-yellow-600",
    in_progress: "bg-blue-600",
    completed: "bg-muted",
  };

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{match.format}</CardTitle>
          <Badge className={statusColors[match.status] || "bg-muted"}>
            {match.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>
          {new Date(match.date).toLocaleDateString("es-ES", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <p>{match.location}</p>
        <p>
          {match.enrolledCount ?? 0}/{match.maxPlayers} jugadores
        </p>
      </CardContent>
    </Card>
  );
}
