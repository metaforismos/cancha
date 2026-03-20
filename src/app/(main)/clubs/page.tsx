"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClubData {
  group: {
    id: string;
    name: string;
    logoUrl: string | null;
    city: string | null;
    country: string | null;
    description: string | null;
  };
  memberCount: number;
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (cityFilter) params.set("city", cityFilter);
    if (countryFilter) params.set("country", countryFilter);

    fetch(`/api/groups?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClubs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cityFilter, countryFilter]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((c) => {
      if (c.group.city) set.add(c.group.city);
    });
    return Array.from(set).sort();
  }, [clubs]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    clubs.forEach((c) => {
      if (c.group.country) set.add(c.group.country);
    });
    return Array.from(set).sort();
  }, [clubs]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clubes</h1>

      <Link href="/clubs/new" className="block mb-2">
        <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-base">
          + Crear club
        </Button>
      </Link>

      {/* Country filter */}
      {countries.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={countryFilter === null ? "default" : "outline"}
            className={`cursor-pointer text-xs ${countryFilter === null ? "bg-green-600" : ""}`}
            onClick={() => {
              setCountryFilter(null);
              setCityFilter(null);
            }}
          >
            Todos
          </Badge>
          {countries.map((c) => (
            <Badge
              key={c}
              variant={countryFilter === c ? "default" : "outline"}
              className={`cursor-pointer text-xs ${countryFilter === c ? "bg-green-600" : ""}`}
              onClick={() => {
                setCountryFilter(countryFilter === c ? null : c);
                setCityFilter(null);
              }}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      {/* City filter */}
      {cities.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {cities.map((c) => (
            <Badge
              key={c}
              variant={cityFilter === c ? "default" : "outline"}
              className={`cursor-pointer text-xs ${cityFilter === c ? "bg-green-600" : ""}`}
              onClick={() => setCityFilter(cityFilter === c ? null : c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-12">
          <p>Cargando...</p>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <div className="text-4xl mb-3">&#127941;</div>
          <p className="font-medium">Sin clubes aun</p>
          <p className="text-sm">Crea el primero y convoca a tus amigos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <Link key={club.group.id} href={`/clubs/${club.group.id}`}>
              <Card className="mb-2 py-0">
                <CardContent className="flex items-center gap-3 px-4 py-3">
                  <Avatar>
                    {club.group.logoUrl ? (
                      <AvatarImage src={club.group.logoUrl} alt={club.group.name} />
                    ) : null}
                    <AvatarFallback className="bg-green-600 text-white">
                      {club.group.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{club.group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[club.group.city, club.group.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
