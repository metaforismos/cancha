"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { POSITIONS, POSITION_LABELS } from "@/types";
import type { Position } from "@/types";
import { toast } from "sonner";

const footLabels: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

export default function CreatePlayerPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [shirtNumber, setShirtNumber] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [dominantFoot, setDominantFoot] = useState<"left" | "right" | "both">("right");

  useEffect(() => {
    fetch("/api/players/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.player?.isAdmin) {
          router.replace("/");
        } else {
          setIsAdmin(true);
        }
      });
  }, [router]);

  function togglePosition(pos: Position) {
    setPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  async function handleCreate() {
    if (!name || !phone) {
      toast.error("Nombre y teléfono son requeridos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name,
          alias: alias || undefined,
          shirtNumber: shirtNumber || undefined,
          positions,
          dominantFoot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear jugador");
      }

      toast.success("Jugador creado");
      setPhone("");
      setName("");
      setAlias("");
      setShirtNumber(null);
      setPositions([]);
      setDominantFoot("right");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Crear jugador</h1>

      <Card>
        <CardContent className="pt-6 space-y-8">
          <div>
            <label className="text-sm font-medium mb-3 block">Teléfono</label>
            <Input
              placeholder="+56912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Nombre</label>
            <Input
              placeholder="Nombre completo"
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

          <Button
            onClick={handleCreate}
            className="w-full bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Creando..." : "Crear jugador"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
