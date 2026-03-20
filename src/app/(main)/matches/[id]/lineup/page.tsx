"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PitchView } from "@/components/lineup-view";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { FORMATIONS_BY_FORMAT } from "@/types";

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

interface MatchInfo {
  match: {
    format: string;
    teamAName?: string | null;
    teamBName?: string | null;
  };
}

export default function LineupPage() {
  const { id } = useParams<{ id: string }>();
  const [lineup, setLineup] = useState<LineupData | null>(null);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<"both" | "single">("both");
  const [formation, setFormation] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/lineup/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/matches/${id}`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([lineupData, matchData]) => {
        if (lineupData) setLineup(lineupData);
        if (matchData) setMatchInfo(matchData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const matchFormat = matchInfo?.match?.format || "11v11";
  const formations = FORMATIONS_BY_FORMAT[matchFormat] || FORMATIONS_BY_FORMAT["11v11"];
  const teamA = matchInfo?.match?.teamAName || "Equipo A";
  const teamB = matchInfo?.match?.teamBName || "Equipo B";

  async function handleGenerate() {
    if (!formation) {
      toast.error("Selecciona una formación antes de generar");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/lineup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: id, mode, formation }),
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
      <div className="space-y-5">
        <PageHeader title="Alineación" />

        {/* Mode selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Modo</label>
          <div className="flex gap-2">
            <Badge
              variant={mode === "both" ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1.5 ${mode === "both" ? "bg-green-600" : ""}`}
              onClick={() => setMode("both")}
            >
              Dos equipos
            </Badge>
            <Badge
              variant={mode === "single" ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1.5 ${mode === "single" ? "bg-green-600" : ""}`}
              onClick={() => setMode("single")}
            >
              Un equipo
            </Badge>
          </div>
        </div>

        {/* Formation selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Formación ({matchFormat})
          </label>
          <div className="flex flex-wrap gap-2">
            {formations.map((f) => (
              <button
                key={f}
                onClick={() => setFormation(f)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border ${
                  formation === f
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-muted border-border text-foreground hover:bg-muted/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground">
              Selecciona la formación y genera la alineación con IA
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700 h-12 px-8 text-base"
              onClick={handleGenerate}
              disabled={generating || !formation}
            >
              {generating ? "Generando con IA..." : "Generar alineación"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Alineación">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLineup(null);
            setFormation("");
          }}
        >
          Regenerar
        </Button>
      </PageHeader>

      <PitchView
        team={lineup.teamA}
        label={isSingleTeam ? "Equipo" : teamA}
        color="#16a34a"
      />

      {!isSingleTeam && (
        <PitchView team={lineup.teamB} label={teamB} color="#2563eb" />
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
