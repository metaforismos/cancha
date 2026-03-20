"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchView } from "@/components/lineup-view";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

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
  const [mode, setMode] = useState<"both" | "single">("both");

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
        body: JSON.stringify({ matchId: id, mode }),
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

  const isSingleTeam = lineup?.teamB?.players?.length === 0;

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Cargando...</div>
    );
  }

  if (!lineup) {
    return (
      <div className="space-y-4">
        <PageHeader title="Alineación" />

        {/* Mode selector */}
        <div className="flex gap-2">
          <Badge
            variant={mode === "both" ? "default" : "outline"}
            className={`cursor-pointer ${mode === "both" ? "bg-green-600" : ""}`}
            onClick={() => setMode("both")}
          >
            Dos equipos
          </Badge>
          <Badge
            variant={mode === "single" ? "default" : "outline"}
            className={`cursor-pointer ${mode === "single" ? "bg-green-600" : ""}`}
            onClick={() => setMode("single")}
          >
            Un equipo
          </Badge>
        </div>

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
      <PageHeader title="Alineación">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? "..." : "Regenerar"}
        </Button>
      </PageHeader>

      {/* Mode selector for regeneration */}
      <div className="flex gap-2">
        <Badge
          variant={mode === "both" ? "default" : "outline"}
          className={`cursor-pointer ${mode === "both" ? "bg-green-600" : ""}`}
          onClick={() => setMode("both")}
        >
          Dos equipos
        </Badge>
        <Badge
          variant={mode === "single" ? "default" : "outline"}
          className={`cursor-pointer ${mode === "single" ? "bg-green-600" : ""}`}
          onClick={() => setMode("single")}
        >
          Un equipo
        </Badge>
      </div>

      <PitchView
        team={lineup.teamA}
        label={isSingleTeam ? "Equipo" : "Equipo A"}
        color="#16a34a"
      />

      {!isSingleTeam && (
        <PitchView team={lineup.teamB} label="Equipo B" color="#2563eb" />
      )}

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
            <CardTitle className="text-lg">
              {isSingleTeam ? "Justificación" : "Balance"}
            </CardTitle>
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
