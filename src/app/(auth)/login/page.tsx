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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-2xl font-bold text-white">
            C
          </div>
          <CardTitle className="text-2xl">Cancha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa tu número de teléfono para comenzar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-center text-lg"
            />
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading || !phone}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
