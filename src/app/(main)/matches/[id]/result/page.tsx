"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/skeleton-cards";
import {
  Goal,
  Handshake,
  CircleAlert,
  CircleX,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";

interface MatchInfo {
  id: string;
  format: string;
  status: string;
  date: string;
  endTime: string | null;
  location: string;
  teamAName: string;
  teamBName: string;
}

interface MatchResult {
  id: string;
  scoreA: number;
  scoreB: number;
}

interface MatchEvent {
  event: {
    id: string;
    type: string;
    playerId: string;
    meta: Record<string, unknown>;
  };
  player: {
    id: string;
    name: string;
  };
}

interface EnrolledPlayer {
  id: string;
  name: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  goal: <Goal className="h-4 w-4 text-green-500" />,
  assist: <Handshake className="h-4 w-4 text-blue-500" />,
  yellow_card: <CircleAlert className="h-4 w-4 text-yellow-500" />,
  red_card: <CircleX className="h-4 w-4 text-red-500" />,
};

const EVENT_LABELS: Record<string, string> = {
  goal: "Gol",
  assist: "Asistencia",
  yellow_card: "Amarilla",
  red_card: "Roja",
};

type EventType = "goal" | "assist" | "yellow_card" | "red_card";

export default function MatchResultPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [canRecordStats, setCanRecordStats] = useState(false);
  const [players, setPlayers] = useState<EnrolledPlayer[]>([]);

  // Score editing
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [savingScore, setSavingScore] = useState(false);

  // Event adding
  const [addingEvent, setAddingEvent] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType>("goal");
  const [selectedPlayer, setSelectedPlayer] = useState("");

  function loadData() {
    Promise.all([
      fetch(`/api/matches/${id}/stats`).then((r) => r.json()),
      fetch(`/api/matches/${id}`).then((r) => r.json()),
    ])
      .then(([statsData, matchData]) => {
        setMatch(statsData.match);
        setResult(statsData.result);
        setEvents(statsData.events || []);
        setCanRecordStats(statsData.canRecordStats);
        setScoreA(statsData.result?.scoreA ?? 0);
        setScoreB(statsData.result?.scoreB ?? 0);

        // Get enrolled players from match detail
        if (matchData.enrollments) {
          setPlayers(
            matchData.enrollments
              .filter((e: { enrollment: { status: string } }) => e.enrollment.status === "enrolled")
              .map((e: { player: { id: string; name: string } }) => ({
                id: e.player.id,
                name: e.player.name,
              }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleSaveScore() {
    setSavingScore(true);
    try {
      const res = await fetch(`/api/matches/${id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_score", scoreA, scoreB }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Marcador guardado");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingScore(false);
    }
  }

  async function handleAddEvent() {
    if (!selectedPlayer) {
      toast.error("Selecciona un jugador");
      return;
    }

    try {
      const res = await fetch(`/api/matches/${id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_event",
          playerId: selectedPlayer,
          type: selectedType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(`${EVENT_LABELS[selectedType]} registrado`);
      setAddingEvent(false);
      setSelectedPlayer("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleRemoveEvent(eventId: string) {
    try {
      const res = await fetch(`/api/matches/${id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_event", eventId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Evento eliminado");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!match) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Partido no encontrado</p>
      </div>
    );
  }

  // Group events by type for display
  const goals = events.filter((e) => e.event.type === "goal");
  const assists = events.filter((e) => e.event.type === "assist");
  const yellowCards = events.filter((e) => e.event.type === "yellow_card");
  const redCards = events.filter((e) => e.event.type === "red_card");

  return (
    <div className="space-y-4 pb-20">
      <PageHeader title="Estadísticas" />

      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Marcador</CardTitle>
        </CardHeader>
        <CardContent>
          {canRecordStats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-2">{match.teamAName}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-3xl font-bold w-10 text-center">
                      {scoreA}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setScoreA(scoreA + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <span className="text-2xl font-bold text-muted-foreground">
                  –
                </span>

                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-2">{match.teamBName}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-3xl font-bold w-10 text-center">
                      {scoreB}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setScoreB(scoreB + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleSaveScore}
                disabled={savingScore}
              >
                {savingScore ? "Guardando..." : "Guardar marcador"}
              </Button>
            </div>
          ) : result ? (
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{match.teamAName}</p>
                <span className="text-4xl font-bold">{result.scoreA}</span>
              </div>
              <span className="text-2xl text-muted-foreground">–</span>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">{match.teamBName}</p>
                <span className="text-4xl font-bold">{result.scoreB}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin marcador registrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Eventos</CardTitle>
            {canRecordStats && !addingEvent && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingEvent(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add event form */}
          {addingEvent && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <div className="grid grid-cols-4 gap-1.5">
                {(["goal", "assist", "yellow_card", "red_card"] as EventType[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors ${
                        selectedType === type
                          ? "bg-green-600/20 border border-green-600/50"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {EVENT_ICONS[type]}
                      {EVENT_LABELS[type]}
                    </button>
                  )
                )}
              </div>

              <select
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccionar jugador</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAddingEvent(false);
                    setSelectedPlayer("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleAddEvent}
                >
                  Registrar
                </Button>
              </div>
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Goles
              </p>
              {goals.map((e) => (
                <EventRow
                  key={e.event.id}
                  event={e}
                  canDelete={canRecordStats}
                  onDelete={handleRemoveEvent}
                />
              ))}
            </div>
          )}

          {/* Assists */}
          {assists.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Asistencias
              </p>
              {assists.map((e) => (
                <EventRow
                  key={e.event.id}
                  event={e}
                  canDelete={canRecordStats}
                  onDelete={handleRemoveEvent}
                />
              ))}
            </div>
          )}

          {/* Yellow Cards */}
          {yellowCards.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Tarjetas amarillas
              </p>
              {yellowCards.map((e) => (
                <EventRow
                  key={e.event.id}
                  event={e}
                  canDelete={canRecordStats}
                  onDelete={handleRemoveEvent}
                />
              ))}
            </div>
          )}

          {/* Red Cards */}
          {redCards.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                Tarjetas rojas
              </p>
              {redCards.map((e) => (
                <EventRow
                  key={e.event.id}
                  event={e}
                  canDelete={canRecordStats}
                  onDelete={handleRemoveEvent}
                />
              ))}
            </div>
          )}

          {events.length === 0 && !addingEvent && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin eventos registrados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventRow({
  event,
  canDelete,
  onDelete,
}: {
  event: MatchEvent;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span>{EVENT_ICONS[event.event.type]}</span>
      <Avatar className="h-7 w-7">
        <AvatarFallback className="bg-green-600 text-white text-xs">
          {event.player.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm flex-1">{event.player.name}</span>
      {canDelete && (
        <button
          onClick={() => onDelete(event.event.id)}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
