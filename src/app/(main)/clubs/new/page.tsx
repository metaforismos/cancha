"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function NewClubPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo(): Promise<string | undefined> {
    if (!logoFile) return undefined;
    const formData = new FormData();
    formData.append("file", logoFile);
    const res = await fetch("/api/uploads/club-logo", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al subir logo");
    }
    const { url } = await res.json();
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !city || !country) return;

    setLoading(true);
    try {
      const logoUrl = await uploadLogo();

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          country,
          description: description || undefined,
          logoUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear club");
      }

      const group = await res.json();
      toast.success("Club creado!");
      router.push(`/clubs/${group.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salio mal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Crear club</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo (opcional)</label>
              <div className="flex items-center gap-4">
                <Avatar
                  className="h-16 w-16 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <AvatarImage src={logoPreview} alt="Logo preview" />
                  ) : null}
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {name ? name.slice(0, 2).toUpperCase() : "Logo"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoFile ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                  {logoFile && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {logoFile.name}
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/heif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del club</label>
              <Input
                placeholder="Ej: Los Cracks FC"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <Input
                  placeholder="Ej: Santiago"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pais</label>
                <Input
                  placeholder="Ej: Chile"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descripcion (opcional)
              </label>
              <Input
                placeholder="Breve descripcion del club"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear club"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
