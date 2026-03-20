"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { LocationPicker } from "@/components/location-picker";
import { PageHeader } from "@/components/page-header";

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error || !data.isAdmin) {
          router.replace(`/clubs/${id}`);
          return;
        }
        setName(data.group.name);
        setCity(data.group.city || "");
        setCountry(data.group.country || "");
        setDescription(data.group.description || "");
        setCurrentLogoUrl(data.group.logoUrl || null);
      })
      .catch(() => router.replace(`/clubs/${id}`))
      .finally(() => setFetching(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !city || !country) return;

    setLoading(true);
    try {
      const newLogoUrl = await uploadLogo();

      const res = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          country,
          description: description || "",
          ...(newLogoUrl ? { logoUrl: newLogoUrl } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar club");
      }

      toast.success("Club actualizado!");
      router.push(`/clubs/${id}`);
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
      <PageHeader title="Editar club" />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo</label>
              <div className="flex items-center gap-4">
                <Avatar
                  className="h-16 w-16 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {(logoPreview || currentLogoUrl) ? (
                    <AvatarImage src={logoPreview || currentLogoUrl!} alt="Logo" />
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
                    {logoFile ? "Cambiar imagen" : currentLogoUrl ? "Cambiar logo" : "Subir imagen"}
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <LocationPicker
              country={country}
              city={city}
              onCountryChange={setCountry}
              onCityChange={setCity}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descripción (opcional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
