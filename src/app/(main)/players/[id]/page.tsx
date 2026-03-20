"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface PlayerProfile {
  player: {
    id: string;
    name: string;
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

  const { player, avgSkills, isMe, canEdit, individualRatings } = data;
  const displaySkills = avgSkills?.skills || player.selfSkills || {};

  return (
    <div className="space-y-4">
      <PageHeader title={player.name} />
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-green-600 text-white text-2xl">
              {player.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h1 className="text-xl font-bold">{player.name}</h1>
            <p className="text-sm text-muted-foreground">
              {footLabels[player.dominantFoot] || player.dominantFoot}
            </p>
            <div className="flex gap-1 justify-center mt-2">
              {(player.positions as string[])?.map((pos) => (
                <Badge key={pos} variant="secondary">
                  {POSITION_LABELS[pos as Position] ?? pos}
                </Badge>
              ))}
            </div>
            {avgSkills && (
              <p className="text-lg font-bold mt-2">
                {avgSkills.overall}/10{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({avgSkills.ratingCount} valoraciones)
                </span>
              </p>
            )}
            {canEdit && !isMe && (
              <Link href={`/players/${id}/edit`} className="mt-2">
                <Button variant="outline" size="sm">Editar jugador</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
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
                <div key={skill} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{SKILL_LABELS[skill] || skill}</span>
                    <span className="text-sm font-medium">
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
              <div className="flex gap-2 pt-2">
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
            SKILLS.map((skill) => (
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
                  <span className="text-xs text-muted-foreground w-6 text-right">
                    {(displaySkills[skill] || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {individualRatings && individualRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valoraciones individuales</CardTitle>
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
                    className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
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
                      <span className="text-sm font-bold">{raterAvg}/10</span>
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
                    <div className="px-3 pb-3 space-y-2 border-t pt-2">
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
                            <span className="text-xs text-muted-foreground w-5 text-right">
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
