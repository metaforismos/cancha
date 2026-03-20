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
import { CircleDot, Lock, Play, CheckCircle, UserPlus } from "lucide-react";

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
}

interface MatchData {
  id: string;
  date: string;
  endTime?: string | null;
  location: string;
  format: string;
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

  const { group, members, isMember, isAdmin } = club;

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    open: <CircleDot className="h-3 w-3" />,
    closed: <Lock className="h-3 w-3" />,
    in_progress: <Play className="h-3 w-3" />,
    completed: <CheckCircle className="h-3 w-3" />,
  };

  return (
    <div className="space-y-4 pb-20">
      <PageHeader title={group.name} />
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

          <div className="flex gap-2 mt-4">
            {isMember ? (
              <>
                {isAdmin && (
                  <Link href={`/clubs/${id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Editar
                    </Button>
                  </Link>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
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
                )}
                <Button
                  variant="outline"
                  className="text-red-500 hover:text-red-400"
                  onClick={handleLeave}
                  disabled={actionLoading}
                >
                  Salir del club
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleJoin}
                disabled={actionLoading}
              >
                {actionLoading ? "Uniéndome..." : "Unirme al club"}
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

      {isMember && (
        <FloatingAction href={`/matches/new?clubId=${id}`} label="+ Crear partido" />
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Miembros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
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
                      <p className="font-medium text-sm">{match.format}</p>
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
