"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKILLS, POSITION_LABELS } from "@/types";
import type { Position } from "@/types";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { DetailSkeleton } from "@/components/skeleton-cards";

const footLabels: Record<string, string> = {
  left: "Pie izquierdo",
  right: "Pie derecho",
  both: "Ambidiestro",
};

const SKILL_LABELS: Record<string, string> = {
  pace: "Velocidad",
  shooting: "Tiro",
  passing: "Pase",
  dribbling: "Regate",
  defending: "Defensa",
  physical: "Físico",
  heading: "Cabeceo",
};

interface IndividualRating {
  rater: { id: string; name: string };
  skills: Record<string, number>;
  createdAt: string;
}

interface MatchStats {
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  matches_played: number;
}

interface PlayerProfile {
  player: {
    id: string;
    name: string;
    alias?: string;
    photoUrl?: string | null;
    positions: string[];
    dominantFoot: string;
    selfSkills: Record<string, number>;
  };
  avgSkills: {
    skills: Record<string, number>;
    ratingCount: number;
    overall: number;
  } | null;
  myRating: { skills: Record<string, number> } | null;
  isMe: boolean;
  canEdit: boolean;
  individualRatings: IndividualRating[];
  matchStats?: MatchStats;
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingMode, setRatingMode] = useState(false);
  const [mySkills, setMySkills] = useState<Record<string, number>>(
    Object.fromEntries(SKILLS.map((s) => [s, 5]))
  );
  const [saving, setSaving] = useState(false);
  const [expandedRater, setExpandedRater] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.myRating) {
          setMySkills(d.myRating.skills);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleSaveRating() {
    setSaving(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratedId: id, skills: mySkills }),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("¡Valoración guardada!");
      setRatingMode(false);
      const d = await fetch(`/api/players/${id}`).then((r) => r.json());
      setData(d);
    } else {
      const err = await res.json();
      toast.error(err.error || "Error al guardar la valoración");
    }
  }

  if (loading || !data) {
    return <DetailSkeleton />;
  }

  const { player, avgSkills, isMe, canEdit, individualRatings, matchStats } = data;
  const displaySkills = avgSkills?.skills || player.selfSkills || {};

  return (
    <div className="space-y-5">
      <PageHeader title={player.name} />

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 shrink-0">
              {player.photoUrl ? (
                <AvatarImage src={player.photoUrl} alt={player.name} />
              ) : null}
              <AvatarFallback className="bg-green-600 text-white text-2xl">
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <h1 className="text-xl font-bold truncate">{player.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {footLabels[player.dominantFoot] || player.dominantFoot}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(player.positions as string[])?.map((pos) => (
                  <Badge key={pos} variant="secondary" className="text-xs">
                    {POSITION_LABELS[pos as Position] ?? pos}
                  </Badge>
                ))}
              </div>
              {avgSkills && (
                <p className="text-lg font-bold">
                  {avgSkills.overall}/10{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({avgSkills.ratingCount} valoraciones)
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Actions — separated from profile info */}
          {canEdit && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link href={isMe ? "/profile" : `/players/${id}/edit`}>
                <Button variant="outline" size="sm" className="w-full">
                  {isMe ? "Editar mi perfil" : "Editar jugador"}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Stats */}
      {matchStats && matchStats.matches_played > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="space-y-0.5">
                <p className="text-xl font-bold">{matchStats.matches_played}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">PJ</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-green-500">{matchStats.goals}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Goles</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-blue-500">{matchStats.assists}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Asist</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-yellow-500">{matchStats.yellow_cards}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">TA</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl font-bold text-red-500">{matchStats.red_cards}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">TR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {ratingMode ? "Valorar jugador" : "Habilidades"}
            </CardTitle>
            {!isMe && !ratingMode && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRatingMode(true)}
              >
                Valorar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {ratingMode ? (
            <>
              {SKILLS.map((skill) => (
                <div key={skill} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{SKILL_LABELS[skill] || skill}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {mySkills[skill]}/10
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          setMySkills((prev) => ({ ...prev, [skill]: level }))
                        }
                        className="flex-1 flex items-center py-2"
                      >
                        <span className={`h-3 w-full rounded-sm transition-colors ${
                          level <= mySkills[skill]
                            ? "bg-green-600"
                            : "bg-muted"
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setRatingMode(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveRating}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar valoración"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              {SKILLS.map((skill) => (
                <div key={skill} className="flex items-center justify-between">
                  <span className="text-sm">{SKILL_LABELS[skill] || skill}</span>
                  <div className="flex gap-1 items-center">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                        <div
                          key={level}
                          className={`h-3 w-3 rounded-sm ${
                            level <= (displaySkills[skill] || 0)
                              ? "bg-green-600"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-7 text-right tabular-nums">
                      {(displaySkills[skill] || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual ratings */}
      {individualRatings && individualRatings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valoraciones individuales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {individualRatings.map((rating) => {
              const isExpanded = expandedRater === rating.rater.id;
              const raterAvg =
                Math.round(
                  (Object.values(rating.skills).reduce((a, b) => a + b, 0) /
                    Object.values(rating.skills).length) *
                    10
                ) / 10;

              return (
                <div
                  key={rating.rater.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedRater(isExpanded ? null : rating.rater.id)
                    }
                    className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-muted/50 transition-colors min-h-[52px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-600 text-white text-xs">
                          {rating.rater.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-sm font-medium">
                          {rating.rater.name}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(rating.createdAt).toLocaleDateString(
                            "es-ES",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums">{raterAvg}/10</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t pt-3">
                      {SKILLS.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-muted-foreground">
                            {SKILL_LABELS[skill] || skill}
                          </span>
                          <div className="flex gap-0.5 items-center">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                                <div
                                  key={level}
                                  className={`h-2 w-2 rounded-sm ${
                                    level <= (rating.skills[skill] || 0)
                                      ? "bg-green-600"
                                      : "bg-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">
                              {rating.skills[skill] || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
