# Cancha — Claude Code Instructions

## What is Cancha

PWA for recreational soccer teams. Players enroll in matches, rate each other's skills, and an AI (Claude API) generates balanced lineups. All UI in Spanish. Mobile-first (375px+).

**Live:** https://getcancha.up.railway.app

## Tech Stack (actual)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| Database | PostgreSQL on Railway via Drizzle ORM |
| Auth | Custom session-based (DB sessions table, httpOnly cookies, 30-day expiry). **No Supabase, no OTP/SMS.** |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) for lineup generation |
| PWA | Serwist (service worker, offline caching, installable) |
| Hosting | Railway |

**Env vars:** `DATABASE_URL`, `ANTHROPIC_API_KEY` (see `.env.local.example`)

## Key Constraints

- **Mobile-first**: All layouts 375px+. No desktop-specific features.
- **Budget**: Railway hobby plan (~$5/mo). Minimize Claude API calls.
- **Language**: All UI text in Spanish.
- **Auth**: Phone number login (no SMS verification — direct session creation).
- **Claude model**: `claude-sonnet-4-6` for lineup generation only.

## Project Structure (summary)

```
src/
├── app/(auth)/          # Login flow
├── app/(main)/          # Authenticated: home, matches, players, clubs, profile
├── app/api/             # REST API routes
├── components/          # UI components (shadcn + custom)
├── lib/db/              # Drizzle schema, queries, migrations
├── lib/claude/          # Lineup generation (prompt + parsing)
├── lib/auth.ts          # Session management
├── lib/validators.ts    # Zod schemas
└── types/               # Shared constants (positions, skills, formats)
```

## Detailed Documentation

Read these only when working on the specific area:

- **`PRD.md`** — Product requirements, user flows, data model, Claude prompt structure
- **`docs/ARCHITECTURE.md`** — Full project structure, DB schema, API routes, auth flow
- **`docs/FEATURES.md`** — Implemented features, known gaps, and v2 backlog
