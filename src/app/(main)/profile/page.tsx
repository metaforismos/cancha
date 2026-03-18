"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, SKILLS } from "@/types";
import type { Position, SkillRatings } from "@/types";
import { toast } from "sonner";

const footLabels: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
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

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [dominantFoot, setDominantFoot] = useState<"left" | "right" | "both">(
    "right"
  );
  const [skills, setSkills] = useState<SkillRatings>(
    Object.fromEntries(SKILLS.map((s) => [s, 3])) as SkillRatings
  );
  const [loading, setLoading] = useState(false);
  const [avgSkills, setAvgSkills] = useState<{
    skills: Record<string, number>;
    ratingCount: number;
    overall: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/players/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.player) {
          setName(data.player.name);
          setPositions(data.player.positions || []);
          setDominantFoot(data.player.dominantFoot || "right");
          if (data.player.selfSkills && Object.keys(data.player.selfSkills).length > 0) {
            setSkills(data.player.selfSkills);
          }
        }
        if (data.avgSkills) {
          setAvgSkills(data.avgSkills);
        }
      });
  }, []);

  function togglePosition(pos: Position) {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  function setSkill(skill: string, value: number) {
    setSkills((prev) => ({ ...prev, [skill]: value }));
  }

  async function handleSave() {
    if (!name || positions.length === 0) {
      toast.error("Nombre y al menos una posición son requeridos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/players", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          positions,
          dominantFoot,
          selfSkills: skills,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("¡Perfil guardado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      {avgSkills && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Valoración de la comunidad ({avgSkills.ratingCount} valoraciones)
              </span>
              <span className="text-xl font-bold">{avgSkills.overall}/5</span>
            </div>
            {avgSkills.ratingCount < 3 && (
              <p className="text-xs text-yellow-500">
                Necesitas {3 - avgSkills.ratingCount} valoraciones más para unirte a partidos. ¡Pide a tus compañeros que te valoren!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Posiciones</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <Badge
                  key={pos}
                  variant={positions.includes(pos) ? "default" : "outline"}
                  className={
                    positions.includes(pos)
                      ? "bg-green-600 cursor-pointer"
                      : "cursor-pointer"
                  }
                  onClick={() => togglePosition(pos)}
                >
                  {pos}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Pie dominante</label>
            <div className="grid grid-cols-3 gap-2">
              {(["left", "right", "both"] as const).map((foot) => (
                <Button
                  key={foot}
                  type="button"
                  variant={dominantFoot === foot ? "default" : "outline"}
                  className={dominantFoot === foot ? "bg-green-600" : ""}
                  onClick={() => setDominantFoot(foot)}
                >
                  {footLabels[foot]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Autoevaluación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SKILLS.map((skill) => (
            <div key={skill} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{SKILL_LABELS[skill]}</span>
                <span className="text-sm font-medium">{skills[skill]}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSkill(skill, level)}
                    className={`h-3 flex-1 rounded-sm transition-colors ${
                      level <= skills[skill] ? "bg-green-600" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar perfil"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
