/**
 * Format a date for match cards in feed (short format).
 * Example: "jue, 15 ene, 14:30"
 */
export function formatMatchDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a date for match detail (long format).
 * Example: "jueves, 15 de enero, 14:30"
 */
export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a deadline date (short, no weekday).
 * Example: "15 ene, 12:30"
 */
export function formatDeadline(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
