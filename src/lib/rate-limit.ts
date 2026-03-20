import { RateLimiterMemory } from "rate-limiter-flexible";

// Limiter general: 100 requests por minuto por IP
export const generalLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Limiter para auth: 10 intentos por minuto por IP
export const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

// Limiter para Claude API: sin límite estricto (solo protección anti-abuse)
export const claudeLimiter = new RateLimiterMemory({
  points: 1000,
  duration: 3600,
});
