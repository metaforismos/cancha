import { MatchFeed } from "@/components/match-feed";
import { PushPrompt } from "@/components/push-prompt";

export default function HomePage() {
  return (
    <div className="space-y-5">
      <PushPrompt />
      <h1 className="text-2xl font-bold">Partidos</h1>
      <MatchFeed />
    </div>
  );
}
