"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, POSITION_LABELS, SKILLS } from "@/types";
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

export default function EditPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [shirtNumber, setShirtNumber] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [dominantFoot, setDominantFoot] = useState<"left" | "right" | "both">("right");
  const [skills, setSkills] = useState<SkillRatings>(
    Object.fromEntries(SKILLS.map((s) => [s, 5])) as SkillRatings
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/players/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.canEdit) {
          router.replace(`/players/${id}`);
          return;
        }
        const p = data.player;
        setName(p.name || "");
        setAlias(p.alias || "");
        setShirtNumber(p.shirtNumber ?? null);
        setBirthDate(p.birthDate || "");
        setPositions(p.positions || []);
        setDominantFoot(p.dominantFoot || "right");
        if (p.selfSkills && Object.keys(p.selfSkills).length > 0) {
          setSkills(p.selfSkills);
        }
      })
      .catch(() => router.replace(`/players/${id}`))
      .finally(() => setFetching(false));
  }, [id, router]);

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
      const res = await fetch(`/api/players/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          alias: alias || undefined,
          shirtNumber: shirtNumber || undefined,
          birthDate: birthDate || undefined,
          positions,
          dominantFoot,
          selfSkills: skills,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      toast.success("Jugador actualizado!");
      router.push(`/players/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="text-center text-muted-foreground py-12">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar jugador</h1>

      <Card>
        <CardContent className="pt-6 space-y-8">
          <div>
            <label className="text-sm font-medium mb-3 block">Nombre</label>
            <Input
              placeholder="Nombre del jugador"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-3 block">Alias</label>
              <Input
                placeholder="Apodo"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium mb-3 block">Número</label>
              <Input
                type="number"
                placeholder="#"
                min={1}
                max={99}
                value={shirtNumber ?? ""}
                onChange={(e) =>
                  setShirtNumber(e.target.value ? parseInt(e.target.value) : null)
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Fecha de nacimiento</label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Posiciones</label>
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
                  {POSITION_LABELS[pos]}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Pie dominante</label>
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
        <CardContent className="pt-6 space-y-4">
          <label className="text-sm font-medium mb-3 block">Habilidades</label>
          {SKILLS.map((skill) => (
            <div key={skill} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{SKILL_LABELS[skill]}</span>
                <span className="text-sm font-medium">{skills[skill]}/10</span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSkill(skill, level)}
                    className="flex-1 flex items-center py-2"
                  >
                    <span className={`h-3 w-full rounded-sm transition-colors ${
                      level <= skills[skill] ? "bg-green-600" : "bg-muted"
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
