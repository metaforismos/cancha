"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FloatingAction } from "@/components/floating-action";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/skeleton-cards";
import { formatMatchDateWithRange } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { CircleDot, Lock, Play, CheckCircle, UserPlus, Trophy, ChevronRight, Plus } from "lucide-react";

interface ClubDetail {
  group: {
    id: string;
    name: string;
    logoUrl: string | null;
    city: string | null;
    country: string | null;
    description: string | null;
  };
  memberCount: number;
  members: {
    player: { id: string; name: string; positions: string[] };
    role: string;
  }[];
  isMember: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface MatchData {
  id: string;
  date: string;
  endTime?: string | null;
  location: string;
  format: string;
  teamAName?: string | null;
  teamBName?: string | null;
  status: string;
  enrolledCount?: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Abierto",
  closed: "Cerrado",
  in_progress: "En juego",
  completed: "Finalizado",
};

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; phone: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/matches?groupId=${id}`).then((r) => r.json()),
    ])
      .then(([clubData, matchData]) => {
        setClub(clubData);
        if (Array.isArray(matchData)) setMatches(matchData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleJoin() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Te uniste al club!");
      // Reload club data
      const updated = await fetch(`/api/groups/${id}`).then((r) => r.json());
      setClub(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Saliste del club");
      const updated = await fetch(`/api/groups/${id}`).then((r) => r.json());
      setClub(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  // Search players for autocomplete
  useEffect(() => {
    if (addSearch.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/players?q=${encodeURIComponent(addSearch.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          // Filter out players already in the club
          const memberIds = new Set(club?.members.map((m) => m.player.id) ?? []);
          setSuggestions(
            data
              .filter((p: { id: string; name: string }) => p.name && !memberIds.has(p.id))
              .slice(0, 8)
              .map((p: { id: string; name: string; phone?: string }) => ({
                id: p.id,
                name: p.name,
                phone: p.phone || "",
              }))
          );
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timeout);
  }, [addSearch, club?.members]);

  async function handleAddPlayerById(playerId: string, playerName: string) {
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${playerName} agregado al club`);
      setAddSearch("");
      setSuggestions([]);
      setShowSuggestions(false);
      const updated = await fetch(`/api/groups/${id}`).then((r) => r.json());
      setClub(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setAddingPlayer(false);
    }
  }

  async function handleAddByPhone() {
    const phone = addSearch.trim();
    if (!phone) return;
    setAddingPlayer(true);
    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Jugador ${data.playerName} agregado al club`);
      setAddSearch("");
      setSuggestions([]);
      setShowSuggestions(false);
      const updated = await fetch(`/api/groups/${id}`).then((r) => r.json());
      setClub(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setAddingPlayer(false);
    }
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (!club) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Club no encontrado</p>
      </div>
    );
  }

  const { group, members, isMember, isAdmin, isSuperAdmin } = club;

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    open: <CircleDot className="h-3 w-3" />,
    closed: <Lock className="h-3 w-3" />,
    in_progress: <Play className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
  };

  return (
    <div className="space-y-5 pb-20">
      <PageHeader title="Detalle del club" />
      {/* Club header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {group.logoUrl ? (
                <AvatarImage src={group.logoUrl} alt={group.name} />
              ) : null}
              <AvatarFallback className="bg-green-600 text-white text-xl">
                {group.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {[group.city, group.country].filter(Boolean).join(", ")}
              </p>
              {group.description && (
                <p className="text-sm mt-1">{group.description}</p>
              )}
              <Badge variant="secondary" className="mt-2 text-xs">
                {club.memberCount}{" "}
                {club.memberCount === 1 ? "miembro" : "miembros"}
              </Badge>
            </div>
          </div>

          {isMember ? (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/clubs/${id}/edit`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={async () => {
                      const url = `${window.location.origin}/invite/club/${id}`;
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: `Únete a ${group.name}`,
                            text: `¡Únete a ${group.name} en Cancha!`,
                            url,
                          });
                        } catch {}
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast.success("¡Link de invitación copiado!");
                      }
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Invitar
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleLeave}
                disabled={actionLoading}
              >
                Salir del club
              </Button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleJoin}
                disabled={actionLoading}
              >
                {actionLoading ? "Uniéndome..." : "Unirme al club"}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {isMember && (
        <FloatingAction href={`/matches/new?clubId=${id}`} label="+ Crear partido" />
      )}

      {/* Leaderboard link */}
      {isMember && (
        <Link href={`/clubs/${id}/leaderboard`}>
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-600/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Tabla de líderes</p>
                  <p className="text-xs text-muted-foreground">
                    Goles, asistencias, MVPs y más
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Miembros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Super admin: add player by name or phone */}
          {isSuperAdmin && (
            <div className="relative mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={addSearch}
                  onChange={(e) => {
                    setAddSearch(e.target.value);
                    if (e.target.value.trim().length < 2) setShowSuggestions(false);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="flex-1"
                  disabled={addingPlayer}
                />
                {/* Show phone-add button when input looks like a phone number */}
                {/^\+?\d{8,}$/.test(addSearch.replace(/[\s\-()]/g, "")) && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 shrink-0"
                    disabled={addingPlayer}
                    onClick={handleAddByPhone}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {addingPlayer ? "..." : "Agregar"}
                  </Button>
                )}
              </div>
              {/* Autocomplete dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left transition-colors"
                      onClick={() => handleAddPlayerById(s.id, s.name)}
                      disabled={addingPlayer}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-600 text-white text-xs">
                          {s.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        {s.phone && (
                          <p className="text-xs text-muted-foreground">{s.phone}</p>
                        )}
                      </div>
                      <Plus className="h-4 w-4 text-green-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions && addSearch.trim().length >= 2 && suggestions.length === 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg p-3">
                  <p className="text-xs text-muted-foreground text-center">
                    No se encontraron jugadores. Puedes agregar por teléfono.
                  </p>
                </div>
              )}
            </div>
          )}
          {members.map(({ player, role }) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <div className="flex items-center gap-3 py-2">
                <Avatar>
                  <AvatarFallback className="bg-green-600 text-white">
                    {player.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                </div>
                {role === "admin" && (
                  <Badge variant="secondary" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Club matches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin partidos aún
            </p>
          ) : (
            <div className="space-y-2">
              {matches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        {match.teamAName || "Equipo A"} vs {match.teamBName || "Equipo B"}
                        <span className="text-xs text-muted-foreground ml-1.5">{match.format}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatMatchDateWithRange(match.date, match.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {match.location}
                      </p>
                    </div>
                    <Badge
                      className={`flex items-center gap-1 ${
                        match.status === "open"
                          ? "bg-green-600"
                          : match.status === "completed"
                            ? "bg-muted"
                            : "bg-yellow-600"
                      }`}
                    >
                      {STATUS_ICONS[match.status]}
                      {STATUS_LABELS[match.status] || match.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
