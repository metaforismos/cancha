"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;

    // Validate phone format: at least 10 digits
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) {
      toast.error("El número debe tener al menos 10 dígitos");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digitsOnly }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Algo salió mal");
        return;
      }

      if (data.needsProfile) {
        router.push("/profile");
      } else {
        router.push("/");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-green-950/30 to-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="text-6xl">&#9917;</div>
          <h1 className="text-3xl font-bold tracking-tight">Cancha</h1>
          <p className="text-muted-foreground leading-snug">
            Crea tu perfil de jugador y participa en partidos de tu zona
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tu número de celular</label>
                <Input
                  type="tel"
                  placeholder="+52 1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-center text-lg"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-base h-12"
                disabled={loading || !phone}
              >
                {loading ? "Entrando..." : "Comenzar"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Al continuar, aceptas unirte a la comunidad de jugadores
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
