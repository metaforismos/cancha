import { MatchFeed } from "@/components/match-feed";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">&#9917; Partidos</h1>
      </div>
      <MatchFeed />
    </div>
  );
}
