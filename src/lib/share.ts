import { formatFullDate } from "@/lib/format";

interface ShareableMatch {
  id: string;
  date: string;
  location: string;
  format: string;
  enrolledCount?: number;
  maxPlayers?: number | null;
}

/**
 * Build a compelling WhatsApp-friendly share message for a match.
 */
export function buildMatchShareMessage(match: ShareableMatch): string {
  const dateStr = formatFullDate(match.date);
  const enrolled = match.enrolledCount ?? 0;
  const maxPlayers =
    match.maxPlayers && match.maxPlayers < 999 ? match.maxPlayers : null;

  let spotsLine: string;
  if (maxPlayers) {
    const spotsLeft = maxPlayers - enrolled;
    if (spotsLeft <= 0) {
      spotsLine = "✅ Completo (waitlist abierta)";
    } else if (spotsLeft === 1) {
      spotsLine = "🔥 ¡Queda 1 lugar!";
    } else {
      spotsLine = `🔥 Quedan ${spotsLeft} lugares`;
    }
  } else {
    spotsLine =
      enrolled > 0 ? `👥 ${enrolled} inscritos` : "👥 Sé el primero en unirte";
  }

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://getcancha.up.railway.app";

  return [
    `⚽ Partido ${match.format} el ${dateStr}`,
    `📍 ${match.location}`,
    spotsLine,
    "",
    `Inscríbete: ${baseUrl}/matches/${match.id}`,
  ].join("\n");
}

/**
 * Returns a wa.me URL that opens WhatsApp with pre-filled text.
 */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
