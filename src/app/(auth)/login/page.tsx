"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Store phone for verify page
    sessionStorage.setItem("otp_phone", formattedPhone);
    router.push("/verify");
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
            Ingresa tu número de WhatsApp para comenzar
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendOTP} className="space-y-4">
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
              {loading ? "Enviando código..." : "Enviar código"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
