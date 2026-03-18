"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SKILLS } from "@/types";
import { toast } from "sonner";

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
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingMode, setRatingMode] = useState(false);
  const [mySkills, setMySkills] = useState<Record<string, number>>(
    Object.fromEntries(SKILLS.map((s) => [s, 3]))
  );
  const [saving, setSaving] = useState(false);

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
    return (
      <div className="py-12 text-center text-muted-foreground">Cargando...</div>
    );
  }

  const { player, avgSkills, isMe } = data;
  const displaySkills = avgSkills?.skills || player.selfSkills || {};

  return (
    <div className="space-y-4">
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
                  {pos}
                </Badge>
              ))}
            </div>
            {avgSkills && (
              <p className="text-lg font-bold mt-2">
                {avgSkills.overall}/5{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({avgSkills.ratingCount} valoraciones)
                </span>
              </p>
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
                      {mySkills[skill]}/5
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          setMySkills((prev) => ({ ...prev, [skill]: level }))
                        }
                        className={`h-3 flex-1 rounded-sm transition-colors ${
                          level <= mySkills[skill]
                            ? "bg-green-600"
                            : "bg-muted"
                        }`}
                      />
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
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-3 w-6 rounded-sm ${
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
    </div>
  );
}
