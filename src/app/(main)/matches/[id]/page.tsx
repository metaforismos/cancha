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
import {
  Copy,
  CircleDot,
  Lock,
  Play,
  CheckCircle,
  BarChart3,
  Trophy,
  Dumbbell,
  MapPin,
  Calendar,
  Clock,
  Users,
  Pencil,
} from "lucide-react";
import { buildMatchShareMessage, whatsappUrl } from "@/lib/share";
import { MatchStatusBadge } from "@/components/match-status-badge";

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
      result.status === "waitlisted"
        ? "Agregado a la lista de espera"
        : "¡Te uniste al partido!"
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

  function handleWhatsAppShare() {
    const message = buildMatchShareMessage({
      id: match.id,
      date: match.date,
      location: match.location,
      format: match.format,
      enrolledCount: enrolled.length,
      maxPlayers: match.maxPlayers,
    });
    window.open(whatsappUrl(message), "_blank");
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  const teamA = match.teamAName || "Equipo A";
  const teamB = match.teamBName || "Equipo B";
  const displayTitle = `${teamA} vs ${teamB}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Detalle del partido">
        <div className="flex items-center gap-1">
          <button
            onClick={handleWhatsAppShare}
            className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Compartir por WhatsApp"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-lg hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Copiar enlace"
          >
            <Copy className="h-5 w-5" />
          </button>
        </div>
      </PageHeader>

      {/* Match info card */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Title + badges row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold leading-tight">{displayTitle}</h2>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-xs">{match.format}</Badge>
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
            </div>
            <Badge className={`${statusColors[match.status] || "bg-muted"} flex items-center gap-1 shrink-0`}>
              {STATUS_ICONS[match.status]}
              {statusLabels[match.status] || match.status}
            </Badge>
          </div>

          {/* Match status badge (enrollment progress) */}
          {match.maxPlayers && match.maxPlayers < 999 && match.status === "open" && (
            <MatchStatusBadge
              enrolled={enrolled.length}
              maxPlayers={match.maxPlayers}
              enrollmentDeadline={match.enrollmentDeadline}
              matchDate={match.date}
            />
          )}

          {/* Match details with icons */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{formatDateWithRange(match.date, match.endTime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span>{match.location}</span>
                {match.locationUrl && (
                  <a
                    href={match.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 underline ml-2 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver mapa
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Cierre inscripción: {formatDeadline(match.enrollmentDeadline)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary action - enrollment */}
      {match.status === "open" && (
        <div className="space-y-3">
          {isEnrolled ? (
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleLeave}
              disabled={enrolling}
            >
              Salir del partido
            </Button>
          ) : (
            <Button
              className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
              onClick={handleJoin}
              disabled={enrolling}
            >
              {enrolling ? "Uniéndome..." : "Unirme al partido"}
            </Button>
          )}
        </div>
      )}

      {/* Secondary actions - contextual links */}
      <div className="grid grid-cols-2 gap-3">
        {match.status === "open" && (
          <Link href={`/matches/${id}/lineup`} className="contents">
            <Button variant="outline" className="h-11">
              <Users className="h-4 w-4 mr-2" />
              Alineación
            </Button>
          </Link>
        )}

        {(match.status === "in_progress" || match.status === "completed") && (
          <Link href={`/matches/${id}/result`} className="contents">
            <Button variant="outline" className="h-11">
              <BarChart3 className="h-4 w-4 mr-2" />
              {data.canRecordStats ? "Estadísticas" : "Resultados"}
            </Button>
          </Link>
        )}

        {match.status === "open" && (
          <Button
            variant="outline"
            className="h-11 text-[#25D366]"
            onClick={handleWhatsAppShare}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current mr-2">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Compartir
          </Button>
        )}

        {canEdit && (
          <Link href={`/matches/${id}/edit`} className="contents">
            <Button variant="ghost" className="h-11 text-muted-foreground">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        )}
      </div>

      {/* Enrolled players */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Inscritos ({enrolled.length}
            {match.maxPlayers && match.maxPlayers < 999 ? `/${match.maxPlayers}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolled.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sin jugadores aún
            </p>
          ) : (
            <div className="divide-y divide-border">
              {enrolled.map(({ player }) => (
                <Link
                  key={player.id}
                  href={`/players/${player.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-green-600 text-white text-xs">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1">{player.name}</span>
                  <div className="flex gap-1">
                    {(player.positions as string[])?.slice(0, 2).map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] px-1.5">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waitlist */}
      {waitlisted.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Lista de espera ({waitlisted.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {waitlisted.map(({ player }) => (
                <div key={player.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs">
                      {player.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
