"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingAction } from "@/components/floating-action";
import { MatchCardSkeleton } from "@/components/skeleton-cards";
import { formatMatchDateWithRange } from "@/lib/format";
import { CircleDot, Lock, Play, CheckCircle, UserPlus, Trophy, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FORMAT_FILTERS,
  FORMAT_FILTER_LABELS,
  FORMAT_FILTER_MAP,
  CATEGORY_LABELS,
} from "@/types";
import type { FormatFilter } from "@/types";

interface MatchData {
  id: string;
  date: string;
  endTime?: string | null;
  location: string;
  format: string;
  category?: string;
  status: string;
  maxPlayers?: number | null;
  enrolledCount?: number;
  teamAName?: string | null;
  teamBName?: string | null;
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
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredMatches =
    formatFilter === "all"
      ? matches
      : matches.filter((m) =>
          FORMAT_FILTER_MAP[formatFilter].includes(m.format)
        );

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

      {/* Format filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(f)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              formatFilter === f
                ? "bg-green-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {FORMAT_FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <div className="text-4xl mb-3">&#9917;</div>
          <p className="font-medium">
            {matches.length === 0
              ? "Sin partidos aún"
              : "Sin partidos en esta categoría"}
          </p>
          <p className="text-sm">
            {matches.length === 0
              ? "Crea el primero y convoca a tus amigos"
              : "Prueba con otro filtro"}
          </p>
        </div>
      ) : (
        filteredMatches.map((match) => (
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
    completed: "bg-zinc-600",
  };

  const enrolled = match.enrolledCount ?? 0;
  const maxPlayers = match.maxPlayers && match.maxPlayers < 999 ? match.maxPlayers : null;
  const isLeague = match.category === "league";
  const isTraining = match.category === "training";
  const hasTeamNames = match.teamAName && match.teamBName;

  return (
    <Card className="mt-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">
              {hasTeamNames ? `${match.teamAName} vs ${match.teamBName}` : match.format}
            </CardTitle>
            {isLeague && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Liga
              </Badge>
            )}
            {isTraining && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                Entreno
              </Badge>
            )}
          </div>
          <Badge className={`${statusColors[match.status] || "bg-muted"} flex items-center gap-1`}>
            {STATUS_ICONS[match.status]}
            {STATUS_LABELS[match.status] || match.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="space-y-1">
          {hasTeamNames && <p>{match.format}</p>}
          <p>{formatMatchDateWithRange(match.date, match.endTime)}</p>
          <p>{match.location}</p>
          <p>
            {enrolled}{maxPlayers ? `/${maxPlayers}` : ""} inscritos
          </p>
        </div>
        {match.status === "open" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-1.5 text-green-500 border-green-600/30 hover:bg-green-600/10"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/matches/${match.id}`;
              const text = `¡Únete al partido ${match.format} en ${match.location}!`;
              if (navigator.share) {
                try {
                  await navigator.share({ title: `Partido ${match.format}`, text, url });
                } catch {}
              } else {
                await navigator.clipboard.writeText(url);
                toast.success("¡Link copiado!");
              }
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invitar jugadores
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
