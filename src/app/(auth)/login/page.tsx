"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  INVITE_CLUB,
  INVITE_REF,
  getCookie,
  setCookie,
  clearCookie,
} from "@/lib/invite";

const COUNTRIES = [
  { code: "MX", prefix: "52", flag: "🇲🇽", label: "México", digits: 10, placeholder: "55 1234 5678" },
  { code: "CL", prefix: "56", flag: "🇨🇱", label: "Chile", digits: 9, placeholder: "9 1234 5678" },
  { code: "AR", prefix: "54", flag: "🇦🇷", label: "Argentina", digits: 10, placeholder: "11 1234 5678" },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

function formatPhoneDisplay(digits: string, country: CountryCode): string {
  if (!digits) return "";
  if (country === "MX") {
    // 55 1234 5678
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "$1 $2 $3").trim();
  }
  if (country === "CL") {
    // 9 1234 5678
    return digits.replace(/(\d{1})(\d{4})(\d{0,4})/, "$1 $2 $3").trim();
  }
  if (country === "AR") {
    // 11 1234 5678
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "$1 $2 $3").trim();
  }
  return digits;
}

export default function LoginPage() {
  const [country, setCountry] = useState<CountryCode>("MX");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capture invite params into cookies on mount
  useEffect(() => {
    const ref = searchParams.get("ref");
    const club = searchParams.get("club");
    if (ref) setCookie(INVITE_REF, ref);
    if (club) setCookie(INVITE_CLUB, club);
  }, [searchParams]);

  const selectedCountry = COUNTRIES.find((c) => c.code === country)!;

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "");
    // Limit to max digits for the selected country
    setPhone(digits.slice(0, selectedCountry.digits));
  }

  function getValidationError(): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < selectedCountry.digits) {
      return `El número debe tener ${selectedCountry.digits} dígitos para ${selectedCountry.label}`;
    }
    // Country-specific first-digit validation
    if (country === "CL" && !digits.startsWith("9")) {
      return "Los celulares en Chile comienzan con 9";
    }
    return null;
  }

  const isValid = phone.length === selectedCountry.digits && !getValidationError();
  const validationError = getValidationError();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    // Full number with country prefix
    const fullNumber = selectedCountry.prefix + phone;

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Algo salió mal");
        return;
      }

      if (data.needsProfile) {
        // Cookies persist through to profile page
        router.push("/profile");
      } else {
        // Existing user — check for pending club invite
        const clubId = getCookie(INVITE_CLUB);
        if (clubId) {
          try {
            await fetch(`/api/groups/${clubId}/members`, { method: "POST" });
            toast.success("¡Te uniste al club!");
          } catch {}
          clearCookie(INVITE_CLUB);
          clearCookie(INVITE_REF);
          router.push(`/clubs/${clubId}`);
        } else {
          clearCookie(INVITE_REF);
          router.push("/");
        }
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

        <Card className="overflow-visible">
          <CardContent className="pt-6 overflow-visible">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tu número de celular</label>
                <div className="flex gap-2">
                  {/* Country selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                      className="flex items-center gap-1 h-11 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-muted-foreground">+{selectedCountry.prefix}</span>
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCountryPicker && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCountry(c.code);
                              setPhone("");
                              setShowCountryPicker(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors ${
                              c.code === country ? "bg-accent/50" : ""
                            }`}
                          >
                            <span className="text-lg">{c.flag}</span>
                            <span className="font-medium">{c.label}</span>
                            <span className="text-muted-foreground ml-auto">+{c.prefix}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Phone input */}
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder={selectedCountry.placeholder}
                    value={formatPhoneDisplay(phone, country)}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="flex-1 text-lg h-11"
                  />
                </div>
                {/* Validation feedback */}
                {validationError && phone.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">{validationError}</p>
                )}
                {isValid && (
                  <p className="text-xs text-green-500 mt-1">✓ Número válido</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-base h-12"
                disabled={loading || !isValid}
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
