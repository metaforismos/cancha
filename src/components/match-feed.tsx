"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingAction } from "@/components/floating-action";
import { MatchCardSkeleton } from "@/components/skeleton-cards";
import { formatMatchDateWithRange } from "@/lib/format";
import { CircleDot, Lock, Play, CheckCircle, Trophy, Dumbbell, MapPin } from "lucide-react";
import { MatchStatusBadge } from "@/components/match-status-badge";
import {
  FORMAT_FILTERS,
  FORMAT_FILTER_LABELS,
  FORMAT_FILTER_MAP,
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
  enrollmentDeadline?: string | null;
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
      <div className="space-y-3 pb-20">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-20">
      <FloatingAction href="/matches/new" label="+ Crear partido" />

      {/* Format filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FORMAT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(f)}
            className={`whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
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
        <div className="text-center text-muted-foreground py-12">
          <div className="text-4xl mb-4">&#9917;</div>
          <p className="font-medium text-foreground">
            {matches.length === 0
              ? "Sin partidos aún"
              : "Sin partidos en esta categoría"}
          </p>
          <p className="text-sm mt-1">
            {matches.length === 0
              ? "Crea el primero y convoca a tus amigos"
              : "Prueba con otro filtro"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <MatchCard match={match} />
            </Link>
          ))}
        </div>
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
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header: title + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {hasTeamNames ? `${match.teamAName} vs ${match.teamBName}` : match.format}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {hasTeamNames && (
                <span className="text-xs text-muted-foreground">{match.format}</span>
              )}
              {isLeague && (
                <Badge variant="secondary" className="text-[10px] px-1.5 flex items-center gap-0.5">
                  <Trophy className="h-2.5 w-2.5" />
                  Liga
                </Badge>
              )}
              {isTraining && (
                <Badge variant="secondary" className="text-[10px] px-1.5 flex items-center gap-0.5">
                  <Dumbbell className="h-2.5 w-2.5" />
                  Entreno
                </Badge>
              )}
            </div>
          </div>
          <Badge className={`${statusColors[match.status] || "bg-muted"} flex items-center gap-1 shrink-0 text-[11px]`}>
            {STATUS_ICONS[match.status]}
            {STATUS_LABELS[match.status] || match.status}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p>{formatMatchDateWithRange(match.date, match.endTime)}</p>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{match.location}</span>
          </div>
        </div>

        {/* Enrollment status */}
        {maxPlayers && match.enrollmentDeadline ? (
          <MatchStatusBadge
            enrolled={enrolled}
            maxPlayers={maxPlayers}
            enrollmentDeadline={match.enrollmentDeadline}
            matchDate={match.date}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            {enrolled}{maxPlayers ? `/${maxPlayers}` : ""} inscritos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
