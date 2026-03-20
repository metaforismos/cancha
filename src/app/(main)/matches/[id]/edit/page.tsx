"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MATCH_FORMATS } from "@/types";
import type { MatchFormat } from "@/types";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";

const STATUS_OPTIONS = [
  { value: "open", label: "Abierto" },
  { value: "closed", label: "Cerrado" },
  { value: "in_progress", label: "En juego" },
  { value: "completed", label: "Finalizado" },
];

export default function EditMatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [format, setFormat] = useState<MatchFormat>("7v7");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [status, setStatus] = useState("open");

  useEffect(() => {
    fetch(`/api/matches/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.canEdit) {
          router.replace(`/matches/${id}`);
          return;
        }
        const m = data.match;
        const d = new Date(m.date);
        setFormat(m.format as MatchFormat);
        setDate(d.toISOString().split("T")[0]);
        setTime(d.toTimeString().slice(0, 5));
        setLocation(m.location);
        setLocationUrl(m.locationUrl || "");
        setStatus(m.status);
      })
      .catch(() => router.replace(`/matches/${id}`))
      .finally(() => setFetching(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !location) return;

    setLoading(true);
    const matchDate = new Date(`${date}T${time}`);
    const deadline = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000);

    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: matchDate.toISOString(),
          location,
          locationUrl: locationUrl || undefined,
          format,
          status,
          enrollmentDeadline: deadline.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }

      toast.success("Partido actualizado!");
      router.push(`/matches/${id}`);
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
      <PageHeader title="Editar partido" />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

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
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
