# Cancha — Claude Code Instructions

## Project Overview
Cancha is a PWA for recreational soccer teams to manage match enrollment and generate balanced lineups using AI. Read `PRD.md` for full requirements and `TECH_STACK.md` for architecture decisions.

## Setup Order

### Phase 1: Scaffolding
1. Initialize Next.js 14+ with App Router, TypeScript, Tailwind
2. Install dependencies: `drizzle-orm`, `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `zod`, `serwist`
3. Install shadcn/ui and add components: button, card, input, dialog, badge, avatar, tabs, toast
4. Set up project structure per TECH_STACK.md
5. Create PWA manifest and service worker

### Phase 2: Database & Auth
1. Define Drizzle schema matching PRD data model (Section 7)
2. Set up Supabase client (browser + server)
3. Implement phone OTP auth flow (login → verify → redirect)
4. Add auth middleware protecting (main) routes
5. Generate and run initial migration

### Phase 3: Core Features
1. Player profile creation/edit
2. Group creation + member management
3. Match creation (admin) with format selection
4. Match enrollment (join/leave/waitlist)
5. Player list with search + rating UI

### Phase 4: Lineup Engine
1. Implement Claude API integration (`lib/claude/lineup.ts`)
2. Build the structured prompt using PRD Section 8 as template
3. Parse and validate JSON response with Zod
4. Lineup view with visual pitch formation (SVG)
5. Regenerate with player lock feature

### Phase 5: Post-Match
1. Result recording (score, goals, assists)
2. Injury tracking
3. MVP voting
4. Feed historical data into lineup context

## Key Constraints
- **Mobile-first**: All layouts must work on 375px+ viewport. No desktop-specific features.
- **Budget**: Supabase free tier, Railway hobby plan. Minimize API calls.
- **Claude model**: Use `claude-sonnet-4-6` for lineup generation.
- **Auth**: Phone OTP only. No email, no social login.
- **Rating gate**: Players need ≥3 ratings from others before joining matches.
