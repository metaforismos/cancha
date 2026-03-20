"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingAction } from "@/components/floating-action";
import { MatchCardSkeleton } from "@/components/skeleton-cards";
import { formatMatchDate } from "@/lib/format";
import { CircleDot, Lock, Play, CheckCircle } from "lucide-react";

interface MatchData {
  id: string;
  date: string;
  location: string;
  format: string;
  status: string;
  maxPlayers?: number | null;
  enrolledCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado",
  in_progress: "En juego",
  completed: "Finalizado",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <CircleDot className="h-3 w-3" />,
  closed: <Lock className="h-3 w-3" />,
  in_progress: <Play className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
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
      <div className="space-y-4 pb-20">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <FloatingAction href="/matches/new" label="+ Crear partido" />
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

  const enrolled = match.enrolledCount ?? 0;
  const maxPlayers = match.maxPlayers && match.maxPlayers < 999 ? match.maxPlayers : null;

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{match.format}</CardTitle>
          <Badge className={`${statusColors[match.status] || "bg-muted"} flex items-center gap-1`}>
            {STATUS_ICONS[match.status]}
            {STATUS_LABELS[match.status] || match.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{formatMatchDate(match.date)}</p>
        <p>{match.location}</p>
        <p>
          {enrolled}{maxPlayers ? `/${maxPlayers}` : ""} inscritos
        </p>
      </CardContent>
    </Card>
  );
}
