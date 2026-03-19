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

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado",
  in_progress: "En juego",
  completed: "Finalizado",
};

export function MatchFeed() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/matches/new">
        <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
          + Crear partido
        </Button>
      </Link>
      {matches.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <div className="text-4xl mb-3">&#9917;</div>
          <p className="font-medium">Sin partidos aún</p>
          <p className="text-sm">Crea el primero y convoca a tus amigos</p>
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
            {STATUS_LABELS[match.status] || match.status}
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
