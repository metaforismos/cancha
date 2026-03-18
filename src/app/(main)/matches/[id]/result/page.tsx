"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MatchResultPage() {
  const { id } = useParams<{ id: string }>();

  // TODO: Fetch and submit match results
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Resultado del partido</h1>

      <Card>
        <CardHeader>
          <CardTitle>Marcador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aún no se ha registrado resultado para el partido {id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
