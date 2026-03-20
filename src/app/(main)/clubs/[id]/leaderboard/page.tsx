"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Trophy, Target, Star, Calendar } from "lucide-react";

interface LeaderboardEntry {
  playerId: string;
  name: string;
  count: number;
}

interface LeaderboardData {
  goals: LeaderboardEntry[];
  assists: LeaderboardEntry[];
  mvps: LeaderboardEntry[];
  matchesPlayed: LeaderboardEntry[];
}

type TabKey = "goals" | "assists" | "mvps" | "matchesPlayed";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "goals", label: "Goles", icon: <Target className="h-4 w-4" /> },
  { key: "assists", label: "Asistencias", icon: <Trophy className="h-4 w-4" /> },
  { key: "mvps", label: "MVPs", icon: <Star className="h-4 w-4" /> },
  { key: "matchesPlayed", label: "Partidos", icon: <Calendar className="h-4 w-4" /> },
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("goals");
  const [period, setPeriod] = useState<"month" | "all">("month");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/groups/${id}/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, period]);

  const entries = data ? data[activeTab] : [];

  return (
    <div className="space-y-4 pb-20">
      <PageHeader title="Tabla de lideres" />

      {/* Period toggle */}
      <div className="flex rounded-lg bg-muted p-1">
        <button
          onClick={() => setPeriod("month")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "month"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Este mes
        </button>
        <button
          onClick={() => setPeriod("all")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Historico
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-green-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 h-4 rounded bg-muted" />
                  <div className="h-6 w-8 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                Sin datos {period === "month" ? "este mes" : ""} para esta
                categoria
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {entries.map((entry, index) => (
                <Link key={entry.playerId} href={`/players/${entry.playerId}`}>
                  <div
                    className={`flex items-center gap-3 py-3 px-2 rounded-lg transition-colors hover:bg-muted ${
                      index < 3 ? "bg-muted/50" : ""
                    }`}
                  >
                    {/* Position / Medal */}
                    <div className="w-8 text-center shrink-0">
                      {index < 3 ? (
                        <span className="text-lg">{MEDALS[index]}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground font-medium">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-600 text-white text-sm">
                        {entry.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {entry.name}
                      </p>
                    </div>

                    {/* Count */}
                    <div className="shrink-0">
                      <span
                        className={`font-bold text-lg ${
                          index === 0 ? "text-green-500" : ""
                        }`}
                      >
                        {entry.count}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
