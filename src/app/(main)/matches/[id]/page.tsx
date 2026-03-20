"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/skeleton-cards";
import { formatDateWithRange, formatDeadline } from "@/lib/format";
import { Share2, CircleDot, Lock, Play, CheckCircle, BarChart3, Trophy, Dumbbell } from "lucide-react";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <CircleDot className="h-3 w-3" />,
  closed: <Lock className="h-3 w-3" />,
  in_progress: <Play className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
};

interface MatchDetail {
  match: {
    id: string;
    groupId: string;
    date: string;
    endTime: string | null;
    location: string;
    locationUrl: string | null;
    format: string;
    category?: string;
    teamAName?: string | null;
    teamBName?: string | null;
    status: string;
    maxPlayers: number | null;
    enrollmentDeadline: string;
  };
  enrollments: {
    enrollment: { status: string; playerId: string };
    player: { id: string; name: string; positions: string[] };
  }[];
  currentUserId: string;
  canEdit: boolean;
  ratingCount?: number;
  canRecordStats?: boolean;
}

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  function load() {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading || !data) {
    return <DetailSkeleton />;
  }

  const { match, enrollments, currentUserId, canEdit } = data;
  const enrolled = enrollments.filter((e) => e.enrollment.status === "enrolled");
  const waitlisted = enrollments.filter(
    (e) => e.enrollment.status === "waitlisted"
  );
  const myEnrollment = enrollments.find(
    (e) => e.enrollment.playerId === currentUserId
  );
  const isEnrolled =
    myEnrollment && myEnrollment.enrollment.status !== "removed";

  async function handleJoin() {
    setEnrolling(true);
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id }),
    });
    const result = await res.json();
    setEnrolling(false);

    if (!res.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.status === "waitlisted" ? "Agregado a la lista de espera" : "¡Te uniste al partido!"
    );
    load();
  }

  async function handleLeave() {
    setEnrolling(true);
    await fetch("/api/enrollments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id }),
    });
    setEnrolling(false);
    toast.success("Saliste del partido");
    load();
  }

  const statusColors: Record<string, string> = {
    open: "bg-green-600",
    closed: "bg-yellow-600",
    in_progress: "bg-blue-600",
    completed: "bg-zinc-600",
  };

  const statusLabels: Record<string, string> = {
    open: "abierto",
    closed: "cerrado",
    in_progress: "en juego",
    completed: "finalizado",
  };

  const ratingCount = data.ratingCount ?? 0;
  const needsRatings = ratingCount < 3;

  async function handleShare() {
    const url = window.location.href;
    const title = `Partido ${match.format}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Detalle del partido">
        <button
          onClick={handleShare}
          className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Compartir partido"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>
                {match.teamAName && match.teamBName
                  ? `${match.teamAName} vs ${match.teamBName}`
                  : match.format}
              </CardTitle>
              {match.category === "league" && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Liga
                </Badge>
              )}
              {match.category === "training" && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  Entreno
                </Badge>
              )}
            </div>
            <Badge className={`${statusColors[match.status] || "bg-muted"} flex items-center gap-1`}>
              {STATUS_ICONS[match.status]}
              {statusLabels[match.status] || match.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            {match.teamAName && match.teamBName && <p>{match.format}</p>}
            <p>{formatDateWithRange(match.date, match.endTime)}</p>
            <p>{match.location}</p>
            {match.locationUrl && (
              <a
                href={match.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 underline"
              >
                Abrir en Maps
              </a>
            )}
            <p>Cierre: {formatDeadline(match.enrollmentDeadline)}</p>
          </div>

          {match.status === "open" && (
            <div className="space-y-2">
              {needsRatings && !isEnrolled && (
                <div className="rounded-lg bg-yellow-600/10 border border-yellow-600/30 px-3 py-2 text-sm text-yellow-500">
                  Necesitas {3 - ratingCount} valoración{3 - ratingCount !== 1 ? "es" : ""} más para inscribirte. ¡Pide a tus compañeros que te valoren!
                </div>
              )}
              <div className="flex gap-2">
                {isEnrolled ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleLeave}
                    disabled={enrolling}
                  >
                    Salir del partido
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleJoin}
                    disabled={enrolling || needsRatings}
                  >
                    {enrolling ? "Uniéndome..." : "Unirme al partido"}
                  </Button>
                )}
                <Link href={`/matches/${id}/lineup`}>
                  <Button variant="outline">Alineación</Button>
                </Link>
              </div>
            </div>
          )}

          {(match.status === "in_progress" || match.status === "completed") && (
            <Link href={`/matches/${id}/result`}>
              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {data.canRecordStats ? "Registrar estadísticas" : "Ver estadísticas"}
              </Button>
            </Link>
          )}

          {canEdit && (
            <Link href={`/matches/${id}/edit`}>
              <Button variant="outline" className="w-full">Editar partido</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Inscritos ({enrolled.length}{match.maxPlayers && match.maxPlayers < 999 ? `/${match.maxPlayers}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {enrolled.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin jugadores aún</p>
          ) : (
            enrolled.map(({ player }) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-3 py-1"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-600 text-white text-xs">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{player.name}</span>
                <div className="flex gap-1 ml-auto">
                  {(player.positions as string[])?.slice(0, 2).map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {waitlisted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lista de espera ({waitlisted.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {waitlisted.map(({ player }) => (
              <div key={player.id} className="flex items-center gap-3 py-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-muted text-xs">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {player.name}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
