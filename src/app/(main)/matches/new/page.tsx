"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FORMAT_PLAYER_COUNTS, MATCH_FORMATS } from "@/types";
import type { MatchFormat } from "@/types";
import { toast } from "sonner";

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<MatchFormat>("7v7");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setGroupId(data[0].group.id);
        }
      });
  }, []);

  const maxPlayers = FORMAT_PLAYER_COUNTS[format];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !location || !groupId) return;

    setLoading(true);

    const matchDate = new Date(`${date}T${time}`);
    const deadline = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000); // 2h before

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          date: matchDate.toISOString(),
          location,
          locationUrl: locationUrl || undefined,
          format,
          maxPlayers,
          enrollmentDeadline: deadline.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create match");
      }

      const { id } = await res.json();
      toast.success("¡Partido creado!");
      router.push(`/matches/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Crear partido</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formato</label>
              <div className="grid grid-cols-4 gap-2">
                {MATCH_FORMATS.map((f) => (
                  <Button
                    key={f}
                    type="button"
                    variant={format === f ? "default" : "outline"}
                    className={format === f ? "bg-green-600" : ""}
                    onClick={() => setFormat(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {maxPlayers} jugadores máx.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Input
                placeholder="Nombre del lugar"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Enlace de Maps (opcional)
              </label>
              <Input
                type="url"
                placeholder="https://maps.google.com/..."
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear partido"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
