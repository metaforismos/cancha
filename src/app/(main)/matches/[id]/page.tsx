"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface MatchDetail {
  match: {
    id: string;
    date: string;
    location: string;
    locationUrl: string | null;
    format: string;
    maxPlayers: number;
    status: string;
    enrollmentDeadline: string;
  };
  enrollments: {
    enrollment: { status: string; playerId: string };
    player: { id: string; name: string; positions: string[] };
  }[];
  currentUserId: string;
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
    return (
      <div className="py-12 text-center text-muted-foreground">Cargando...</div>
    );
  }

  const { match, enrollments, currentUserId } = data;
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
    completed: "bg-muted",
  };

  const statusLabels: Record<string, string> = {
    open: "abierto",
    closed: "cerrado",
    in_progress: "en juego",
    completed: "finalizado",
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Detalle del partido</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{match.format}</CardTitle>
            <Badge className={statusColors[match.status] || "bg-muted"}>
              {statusLabels[match.status] || match.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {new Date(match.date).toLocaleDateString("es-ES", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
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
            <p>
              Cierre:{" "}
              {new Date(match.enrollmentDeadline).toLocaleString("es-ES", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {match.status === "open" && (
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
                  disabled={enrolling}
                >
                  {enrolling ? "..." : "Unirme al partido"}
                </Button>
              )}
              <Link href={`/matches/${id}/lineup`}>
                <Button variant="outline">Alineación</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Inscritos ({enrolled.length}/{match.maxPlayers})
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
