# Cancha — Tech Stack

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Framework** | Next.js 16 (App Router) | PWA-ready, SSR, API routes in one repo |
| **Language** | TypeScript 5.9 | Strict mode |
| **UI** | Tailwind CSS 4 + shadcn/ui + Lucide | Mobile-first, dark mode default |
| **Database** | PostgreSQL on Railway | Direct connection via `postgres://` URL |
| **ORM** | Drizzle ORM | Type-safe schema, migrations, queries |
| **Auth** | Custom session-based | DB-backed sessions, httpOnly cookies, 30-day expiry. No Supabase, no SMS/OTP |
| **LLM** | Anthropic Claude API (`claude-sonnet-4-6`) | Lineup generation only |
| **PWA** | Serwist | Service worker, precaching, installable |
| **Hosting** | Railway | Next.js deployed directly |
| **Notifications** | Sonner (toast) | In-app only. No push notifications yet |

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Railway (Next.js + PostgreSQL) | ~$5/mo (Hobby plan) |
| Claude API | ~$1-3/mo (~$0.003/lineup call) |
| **Total** | **~$5-8/mo** |

## Environment Variables

```
DATABASE_URL=postgresql://...     # Railway PostgreSQL connection string
ANTHROPIC_API_KEY=sk-ant-...      # Anthropic API key
```

See `.env.local.example` for template.

## Key Dependencies

```json
{
  "next": "16.1.7",
  "react": "19.2.3",
  "drizzle-orm": "0.45.1",
  "@anthropic-ai/sdk": "0.79.0",
  "@serwist/next": "9.5.7",
  "country-state-city": "latest",
  "zod": "4.3.6",
  "sonner": "2.0.7",
  "lucide-react": "0.577.0"
}
```

## Development

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npx drizzle-kit push # Push schema changes to DB
npx drizzle-kit generate # Generate migration files
```
