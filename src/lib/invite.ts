export const INVITE_CLUB = "invite_club";
export const INVITE_REF = "invite_ref";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAge = 3600) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}
