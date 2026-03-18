"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PitchView } from "@/components/lineup-view";
import { toast } from "sonner";

interface LineupData {
  id: string;
  teamA: {
    formation: string;
    players: { playerId: string; name: string; position: string }[];
  };
  teamB: {
    formation: string;
    players: { playerId: string; name: string; position: string }[];
  };
  bench: { playerId: string; name: string }[];
  justification: string | null;
  published: boolean;
}

export default function LineupPage() {
  const { id } = useParams<{ id: string }>();
  const [lineup, setLineup] = useState<LineupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/lineup/${id}`)
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        if (data) setLineup(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/lineup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate lineup");
      }

      const data = await res.json();
      setLineup(data);
      toast.success("¡Alineación generada!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Cargando...</div>
    );
  }

  if (!lineup) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Alineación</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aún no se ha generado la alineación
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? "Generando con IA..." : "Generar alineación"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alineación</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "..." : "Regenerar"}
        </Button>
      </div>

      <PitchView team={lineup.teamA} label="Equipo A" color="#16a34a" />
      <PitchView team={lineup.teamB} label="Equipo B" color="#2563eb" />

      {lineup.bench.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suplentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lineup.bench.map((p) => (
                <span
                  key={p.playerId}
                  className="text-sm bg-muted px-2 py-1 rounded"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {lineup.justification && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lineup.justification}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
