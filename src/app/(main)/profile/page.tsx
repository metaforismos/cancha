"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { POSITIONS, POSITION_LABELS, SKILLS } from "@/types";
import type { Position, SkillRatings } from "@/types";
import { toast } from "sonner";
import { Share2, Camera } from "lucide-react";
import { INVITE_CLUB, INVITE_REF, getCookie, clearCookie } from "@/lib/invite";

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
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [shirtNumber, setShirtNumber] = useState<number | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);
  const [dominantFoot, setDominantFoot] = useState<"left" | "right" | "both">(
    "right"
  );
  const [skills, setSkills] = useState<SkillRatings>(
    Object.fromEntries(SKILLS.map((s) => [s, 5])) as SkillRatings
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          setPlayerId(data.player.id);
          setPhone(data.player.phone || "");
          setName(data.player.name);
          setAlias(data.player.alias || "");
          setShirtNumber(data.player.shirtNumber ?? null);
          setBirthDate(data.player.birthDate || "");
          setPositions(data.player.positions || []);
          setDominantFoot(data.player.dominantFoot || "right");
          if (data.player.selfSkills && Object.keys(data.player.selfSkills).length > 0) {
            setSkills(data.player.selfSkills);
          }
          if (data.player.photoUrl) {
            setPhotoUrl(data.player.photoUrl);
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

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error("La imagen debe pesar menos de 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // Create a canvas to resize the image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 200;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
        } else {
          if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoUrl(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
          alias: alias || undefined,
          shirtNumber: shirtNumber || undefined,
          birthDate: birthDate || undefined,
          positions,
          dominantFoot,
          selfSkills: skills,
          photoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success("¡Perfil guardado!");

      // Check for pending club invite
      const clubId = getCookie(INVITE_CLUB);
      if (clubId) {
        try {
          await fetch(`/api/groups/${clubId}/members`, { method: "POST" });
          toast.success("¡Te uniste al club!");
        } catch {}
        clearCookie(INVITE_CLUB);
        clearCookie(INVITE_REF);
        router.push(`/clubs/${clubId}`);
        return;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Photo + Rating header */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 shrink-0">
                {photoUrl ? (
                  <AvatarImage src={photoUrl} alt={name} />
                ) : null}
                <AvatarFallback className="bg-green-600 text-white text-2xl">
                  {name ? name.slice(0, 2).toUpperCase() : "?"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white shadow-md hover:bg-green-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{phone.startsWith("52") ? "🇲🇽 +52 " : phone.startsWith("56") ? "🇨🇱 +56 " : phone.startsWith("54") ? "🇦🇷 +54 " : ""}{phone.startsWith("52") ? phone.slice(2) : phone.startsWith("56") ? phone.slice(2) : phone.startsWith("54") ? phone.slice(2) : phone}</p>
              {avgSkills && (
                <div className="mt-1">
                  <p className="text-lg font-bold">
                    {avgSkills.overall}/10{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({avgSkills.ratingCount} valoraciones)
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Alias</label>
              <Input
                placeholder="Tu apodo"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div className="w-24">
              <label className="text-sm font-medium mb-2 block">Número</label>
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
            <label className="text-sm font-medium mb-2 block">Fecha de nacimiento</label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Posiciones</label>
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
            <label className="text-sm font-medium mb-2 block">Pie dominante</label>
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
          <label className="text-sm font-medium mb-2 block">Habilidades</label>
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
            {loading ? "Guardando..." : "Guardar perfil"}
          </Button>
        </CardContent>
      </Card>

      {/* Share referral link */}
      {playerId && (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={async () => {
            const url = `${window.location.origin}/invite/user/${playerId}`;
            if (navigator.share) {
              try {
                await navigator.share({
                  title: "Cancha",
                  text: "¡Únete a Cancha y juega fútbol conmigo!",
                  url,
                });
              } catch {}
            } else {
              await navigator.clipboard.writeText(url);
              toast.success("¡Link copiado!");
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Invitar amigos a Cancha
        </Button>
      )}
    </div>
  );
}
