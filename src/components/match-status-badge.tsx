"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface MatchStatusBadgeProps {
  enrolled: number;
  maxPlayers: number;
  enrollmentDeadline: string;
  matchDate: string;
}

function getCountdown(deadline: string): string | null {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const diff = dl - now;

  if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `Cierra en ${hours}h ${minutes}m`;
}

export function MatchStatusBadge({
  enrolled,
  maxPlayers,
  enrollmentDeadline,
  matchDate,
}: MatchStatusBadgeProps) {
  const [countdown, setCountdown] = useState<string | null>(() =>
    getCountdown(enrollmentDeadline)
  );

  useEffect(() => {
    const update = () => setCountdown(getCountdown(enrollmentDeadline));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [enrollmentDeadline]);

  const remaining = maxPlayers - enrolled;

  let label: string;
  let colorClass: string;

  if (enrolled >= maxPlayers) {
    label = "Completo";
    colorClass = "bg-green-600 text-white";
  } else if (enrolled >= maxPlayers * 0.8) {
    label = `Quedan ${remaining} lugares`;
    colorClass = "bg-yellow-600 text-white";
  } else if (enrolled >= maxPlayers * 0.6) {
    label = `Faltan ${remaining} jugadores`;
    colorClass = "bg-orange-600 text-white";
  } else {
    label = `En riesgo (${enrolled}/${maxPlayers})`;
    colorClass = "bg-red-600 text-white";
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge className={`${colorClass} text-xs`}>{label}</Badge>
      {countdown && (
        <Badge variant="outline" className="text-xs flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {countdown}
        </Badge>
      )}
    </div>
  );
}
