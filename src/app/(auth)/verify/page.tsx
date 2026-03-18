"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("otp_phone");
    if (!storedPhone) {
      router.replace("/login");
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || !phone) return;

    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    sessionStorage.removeItem("otp_phone");
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verificar código</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingresa el código de 6 dígitos enviado a {phone}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="text-center text-2xl tracking-[0.5em]"
            />
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verificando..." : "Verificar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Cambiar número
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
