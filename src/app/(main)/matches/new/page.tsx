"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MATCH_FORMATS, MATCH_CATEGORIES, CATEGORY_LABELS } from "@/types";
import type { MatchFormat, MatchCategory } from "@/types";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { ShareMatchDialog } from "@/components/share-match-dialog";

interface ClubOption {
  group: { id: string; name: string };
  role: string;
}

export default function NewMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClubId = searchParams.get("clubId");

  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<MatchFormat>("7v7");
  const [category, setCategory] = useState<MatchCategory>("friendly");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTimeVal, setEndTimeVal] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [clubId, setClubId] = useState(preselectedClubId || "");
  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [teamAName, setTeamAName] = useState("Equipo A");
  const [teamBName, setTeamBName] = useState("Equipo B");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [createdMatch, setCreatedMatch] = useState<{
    id: string;
    date: string;
    location: string;
    format: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/groups?my=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClubs(data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !endTimeVal || !location) return;

    setLoading(true);

    const matchDate = new Date(`${date}T${time}`);
    const endTime = new Date(`${date}T${endTimeVal}`);
    // If end time is before start time, assume next day
    if (endTime <= matchDate) {
      endTime.setDate(endTime.getDate() + 1);
    }
    const deadline = new Date(matchDate.getTime() - 2 * 60 * 60 * 1000); // 2h before

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: matchDate.toISOString(),
          endTime: endTime.toISOString(),
          location,
          locationUrl: locationUrl || undefined,
          format,
          category,
          teamAName: teamAName || undefined,
          teamBName: teamBName || undefined,
          enrollmentDeadline: deadline.toISOString(),
          groupId: clubId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create match");
      }

      const { id } = await res.json();
      toast.success("Partido creado!");
      setCreatedMatch({
        id,
        date: matchDate.toISOString(),
        location,
        format,
      });
      setShowShareDialog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Crear partido" />

      <Card>
        <CardContent className="pt-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de partido</label>
              <div className="grid grid-cols-3 gap-2">
                {MATCH_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    className={category === cat ? "bg-green-600" : ""}
                    onClick={() => setCategory(cat)}
                    size="sm"
                  >
                    {CATEGORY_LABELS[cat]}
                  </Button>
                ))}
              </div>
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
              <p className="text-xs text-muted-foreground">
                Sin limite de inscritos
              </p>
            </div>

            {/* Team names */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombres de equipos (opcional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder='Ej: "Rojos"'
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  maxLength={30}
                />
                <Input
                  placeholder='Ej: "Blancos"'
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  maxLength={30}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Elige nombres para identificar a los equipos
              </p>
            </div>

            {/* Club selector */}
            {clubs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Organizado por</label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Partido libre (sin club)</option>
                  {clubs.map((c) => (
                    <option key={c.group.id} value={c.group.id}>
                      {c.group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora inicio</label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora término</label>
                <Input
                  type="time"
                  value={endTimeVal}
                  onChange={(e) => setEndTimeVal(e.target.value)}
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

      {createdMatch && (
        <ShareMatchDialog
          open={showShareDialog}
          onOpenChange={(open) => {
            setShowShareDialog(open);
            if (!open) {
              router.push(`/matches/${createdMatch.id}`);
            }
          }}
          match={createdMatch}
        />
      )}
    </div>
  );
}
