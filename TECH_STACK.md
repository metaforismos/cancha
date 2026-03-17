# Cancha — Tech Stack & Project Structure

## Recommended Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 14+ (App Router) | PWA-ready, SSR, API routes in one repo, great DX |
| **Language** | TypeScript | Type safety across full stack |
| **UI** | Tailwind CSS + shadcn/ui | Mobile-first, fast to build, consistent components |
| **Database** | PostgreSQL (via Supabase) | Free tier, built-in auth, realtime subscriptions, Row Level Security |
| **Auth** | Supabase Auth (Phone OTP) | Free SMS OTP up to 30 MAU on free tier, then Twilio for scale |
| **ORM** | Drizzle ORM | Lightweight, type-safe, great with Supabase/Postgres |
| **LLM** | Anthropic Claude API (claude-sonnet-4-6) | Cost-effective for structured lineup generation |
| **Hosting** | Railway | User preference. Deploy Next.js directly |
| **PWA** | next-pwa / Serwist | Service worker, installable, offline caching |
| **Push** | Web Push API (via service worker) | Free, no third-party dependency |

### Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Railway (Next.js) | ~$5/mo (Hobby plan) |
| Supabase (DB + Auth) | Free tier (500MB, 50K MAU) |
| Claude API | ~$1-3/mo (lineup calls are small, ~$0.003/call) |
| Twilio SMS (if needed) | ~$0.0079/SMS |
| **Total** | **~$5-10/mo** |

## Project Structure

```
cancha/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, verify)
│   │   │   ├── login/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── (main)/             # Authenticated routes
│   │   │   ├── layout.tsx      # Bottom nav layout
│   │   │   ├── page.tsx        # Home — match feed
│   │   │   ├── matches/
│   │   │   │   ├── [id]/page.tsx       # Match detail
│   │   │   │   ├── [id]/lineup/page.tsx # Lineup view
│   │   │   │   ├── [id]/result/page.tsx # Post-match
│   │   │   │   └── new/page.tsx        # Create match (admin)
│   │   │   ├── players/
│   │   │   │   ├── page.tsx            # Player list
│   │   │   │   └── [id]/page.tsx       # Player profile + rate
│   │   │   └── profile/
│   │   │       └── page.tsx            # My profile
│   │   ├── api/
│   │   │   ├── lineup/generate/route.ts # Claude API call
│   │   │   ├── matches/route.ts
│   │   │   ├── ratings/route.ts
│   │   │   └── auth/otp/route.ts
│   │   ├── layout.tsx          # Root layout + PWA meta
│   │   ├── manifest.ts         # PWA manifest
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn components
│   │   ├── match-card.tsx
│   │   ├── player-card.tsx
│   │   ├── lineup-view.tsx     # Formation visualization
│   │   ├── skill-radar.tsx     # Radar chart for skills
│   │   ├── rating-input.tsx
│   │   └── bottom-nav.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle schema (all tables)
│   │   │   ├── queries.ts      # Reusable queries
│   │   │   └── migrations/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   └── server.ts       # Server client
│   │   ├── claude/
│   │   │   ├── lineup.ts       # Lineup generation prompt + parsing
│   │   │   └── types.ts        # Response types
│   │   ├── utils.ts
│   │   └── validators.ts       # Zod schemas
│   └── types/
│       └── index.ts            # Shared types
├── public/
│   ├── icons/                  # PWA icons
│   └── sw.js                   # Service worker
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── .env.local                  # SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
```

## Database Setup (Supabase)

1. Create project at supabase.com
2. Enable Phone Auth (Settings → Auth → Phone)
3. Schema managed via Drizzle migrations
4. Enable Row Level Security on all tables
5. Realtime enabled for `match_enrollment` (live enrollment count)

## Key Implementation Notes

### Lineup Generation
- Use `claude-sonnet-4-6` (fast, cheap, good at structured output)
- Enforce JSON output with system prompt
- Cache lineups — don't re-call API on page refresh
- Rate limit: max 5 regenerations per match

### PWA
- Manifest with `display: standalone`
- Cache match list and player profiles for offline
- Add to homescreen prompt on second visit

### Mobile UX
- Bottom navigation (Home, Players, Profile)
- Pull-to-refresh on match feed
- Swipe to join/leave match
- Formation displayed as visual pitch diagram (SVG or canvas)

## Claude Code Handoff

When opening this project in Claude Code, use this prompt:

```
Read PRD.md and TECH_STACK.md in this folder. Initialize a Next.js 14+ project
with TypeScript, Tailwind, and the App Router. Set up the project structure as
defined in TECH_STACK.md. Start with:
1. Project scaffolding (next.js + deps)
2. Drizzle schema matching the PRD data model
3. Supabase auth with phone OTP
4. Basic page routing and bottom nav layout
5. Match creation and enrollment flows
```
