# Cancha — Business Context

## 1. Executive Summary

**Cancha** is a mobile-first web application that solves coordination and fairness problems in recreational soccer. Every week, millions of players across Latin America organize pickup games through WhatsApp groups — spending 30+ minutes debating who plays, manually picking teams, and ending up with lopsided matches. Cancha replaces that friction with a structured platform where players enroll, rate each other's skills, and an AI engine generates balanced lineups automatically.

**Current status:** Live product at https://getcancha.up.railway.app. Actively developed. Zero revenue. Pre-launch (no formal user acquisition yet).

**Geographic focus:** Mexico, Chile, and Argentina — all UI in Spanish.

**Cost to operate:** ~$5–8/month (hosting + AI costs). No external funding required.

---

## 2. Problem & Market

### The Problem

Recreational soccer is the most popular sport in Latin America, but organizing games is stuck in the WhatsApp era:

- **Team picking is political and slow.** Every week, someone has to manually split players into two teams. The result is usually unfair — the person picking knows who's good and stacks their own team, or teams are picked randomly and games are one-sided. This kills the fun.
- **Coordination is scattered.** Date, time, location, who's confirmed, who cancelled last minute — it's all buried in a WhatsApp thread with 50+ unread messages.
- **No player memory.** There's no record of who played, how they performed, or how skilled they are. New players are unknown quantities. Veterans get no recognition.
- **Groups are closed.** If you want to play but don't know anyone with a regular group, there's no way to discover games or teams near you.

### The Market

- Latin America has an estimated 200M+ people who play soccer regularly, the vast majority in informal settings (parks, rented courts, community fields).
- In countries like Mexico, Chile, and Argentina, it's common for groups of 10–22 adults to rent a court weekly and organize matches via WhatsApp.
- The court rental industry alone generates billions annually across the region — yet the player coordination layer on top of it is entirely manual.
- There is no dominant app serving this market in LATAM. Existing solutions are either US/Europe-focused, designed for organized leagues (not pickup games), or simply unused.

### Target Users

| Segment | Description | Need |
|---------|-------------|------|
| **Regular players** | Adults (18–50+) who play weekly in a fixed group | Easy enrollment, fair teams, track their stats |
| **Organizers** | The 1–2 people in each group who handle logistics | Automate coordination, stop being the "bad guy" who picks teams |
| **Free agents** | Players looking for a game near them | Discover groups, join matches, build a profile |

---

## 3. Product Overview

Cancha is a fully functional product with the following features implemented and live:

### Player Identity
- **Phone-based login** — no passwords, no SMS codes. Players enter their phone number (Mexico +52, Chile +56, Argentina +54) and get instant access. The trust model assumes players are sharing links within their real-life soccer groups.
- **Player profiles** — name, alias, shirt number, birth date, positions played (goalkeeper, center back, midfielder, striker, etc.), and dominant foot.
- **Self-assessed skills** — each player rates themselves 1–10 across 7 dimensions: pace, shooting, passing, dribbling, defending, physical strength, and heading.

### Crowdsourced Skill Ratings
- Any player can rate any other player on the same 7-skill scale.
- The system averages all peer ratings to produce a community-validated skill profile.
- This peer-rated data feeds directly into the AI lineup engine — ensuring teams are balanced based on real observed ability, not self-promotion.
- A minimum of 3 peer ratings is required before a player can join competitive matches.

### Clubs
- Players can create or join clubs (groups). Each club has a name, logo, location (city/country), and description.
- Club admins manage membership, create matches, and generate lineups.
- Players can browse and filter clubs by location, or join via invite links.

### Match Coordination
- **Match creation:** date, start time, end time, location (with optional Google Maps link), format (5v5, 7v7, 8v8, or 11v11).
- **Enrollment:** players join with one tap. Automatic waitlist when capacity is reached.
- **Auto-status transitions:** the match status updates automatically based on time — from "open" (accepting players) to "in progress" (game started) to "completed" (game ended). No manual intervention needed.
- **Enrollment deadline:** automatically set to 2 hours before kickoff.

### AI-Powered Lineup Generation (Core Differentiator)
- When enough players have enrolled, an admin generates balanced lineups with one tap.
- The AI engine (powered by Anthropic's Claude API) analyzes each player's averaged skill ratings, preferred positions, and dominant foot.
- It produces two teams with assigned formations (e.g., 4-3-3 vs 3-5-2), position-by-position assignments, and a bench list.
- The algorithm guarantees a maximum 0.3-point average rating difference between teams — ensuring genuinely competitive matches.
- Alternative mode: generate a single "best XI" from the player pool.
- Admins can lock specific players to a team and regenerate (up to 5 times per match).
- Visual pitch diagram shows each player's assigned position.

### Match Statistics
- **During or after the match** (up to 24 hours post-game), any player can record:
  - Final score (Team A vs Team B)
  - Goals — who scored
  - Assists — who assisted
  - Yellow cards
  - Red cards
- These stats aggregate into each player's career profile.

### Player Career Stats
- Each player profile displays cumulative stats across all completed matches: matches played, goals, assists, yellow cards, red cards.
- This creates a persistent identity and reputation system for recreational players — something that doesn't exist in WhatsApp groups.

### Social Sharing & Invitations
- **User referral links** — any player can share a personal invite link. When opened in WhatsApp or social media, the preview shows their name: "[Name] te invita a Cancha" with a branded image.
- **Club invite links** — club admins share links that show the club name and member count in the preview. New users who click the link automatically join the club after registering.
- Both flows use dynamic Open Graph metadata for rich WhatsApp/social media previews.

### Installable & Offline-Ready
- Cancha is a Progressive Web App (PWA) — users can install it on their phone's home screen like a native app, without going through an app store.
- Static assets are cached for offline access.

---

## 4. Business Model

### Current State: Pre-Revenue

Cancha generates zero revenue. It costs ~$5–8/month to run:
- **Hosting:** $5/month (Railway hobby plan — web server + database)
- **AI costs:** ~$1–3/month ($0.003 per lineup generation — negligible at current scale)

This ultra-low cost structure means Cancha can serve hundreds of active users before needing to scale infrastructure.

### Potential Revenue Paths

| Model | Description | Feasibility |
|-------|-------------|-------------|
| **Freemium (stats & analytics)** | Free basic use; paid tier unlocks advanced stats (per-player analytics, historical trends, head-to-head records) | Medium — requires a meaningful user base first |
| **Premium clubs** | Paid tier for clubs wanting season tracking, league tables, tournament brackets, custom branding | High — clear value for organized groups |
| **Player marketplace** | Connect "free agent" players with groups that need extra players for a match | High — solves a real problem, potential for transaction fees |
| **Venue partnerships** | Courts and sports centers advertise available slots to active Cancha users in their area | Medium — requires geographic density |
| **Tournament tools** | Paid features for organizing multi-team tournaments with brackets, standings, and scheduling | Medium — natural extension of current features |
| **Data licensing** | Anonymized player skill and match data for amateur leagues, sports analytics companies, or talent scouts | Low (long-term) — requires massive scale |

### Unit Economics Potential

- At scale, the primary costs are hosting (~$0.01/user/month) and AI lineup generation (~$0.003/generation).
- A subscription at $3–5/month per club (not per player) would be profitable at just 10 paying clubs.
- A player marketplace with a $1–2 booking fee per match could generate meaningful volume.

---

## 5. Competitive Landscape

### Direct Competitors

| App | Focus | Market | Weakness vs Cancha |
|-----|-------|--------|--------------------|
| **Timpik** | Match organization | Spain, some LATAM | No AI lineup balancing, complex UX |
| **Spond** | Team management | Europe (Norway-based) | Designed for organized clubs, not pickup games |
| **TeamSnap** | Youth sports management | USA/Canada | Enterprise-priced, US-centric, no AI features |
| **Sportmatch** | Player matching | Argentina | Social network approach, not match coordination |
| **Footbar / Panna** | Court booking | Various | Focus on venues, not player coordination |

### The Real Competitor: WhatsApp

WhatsApp is free, universal, and already embedded in every soccer group's workflow. Any solution must be **dramatically better** at something specific to justify adding a new app. Cancha's angle is:

1. **AI-balanced teams** — WhatsApp literally cannot do this
2. **One-tap enrollment** — vs. scrolling through 200 messages to figure out who's confirmed
3. **Persistent player identity** — vs. being a phone number in a group chat

### Competitive Moat

The AI lineup balancing is Cancha's primary differentiator. No competitor offers anything similar. However, the feature itself is not technically hard to replicate — the moat would come from **accumulated player data** (skill ratings from hundreds of matches) that makes lineups increasingly accurate over time.

---

## 6. Technical Foundation (Non-Technical Summary)

- **No app store needed.** Cancha is a web app that works in any mobile browser and can be "installed" on the home screen. This eliminates the friction (and cost) of App Store/Play Store distribution.
- **AI is a utility, not a cost center.** Each lineup generation costs $0.003. Even with thousands of matches, AI costs would be under $50/month.
- **Scales cheaply.** Current infrastructure ($5/month) can handle hundreds of concurrent users. Scaling to thousands would cost ~$20–50/month.
- **Solo-developer velocity.** Built entirely by the founder using AI-assisted coding tools, enabling rapid iteration without a development team.
- **No vendor lock-in.** Standard open-source technologies (PostgreSQL, Next.js) — can migrate hosting providers or scale without rewriting.

---

## 7. Current Traction & Stage

| Metric | Value |
|--------|-------|
| Product status | Live, fully functional |
| URL | https://getcancha.up.railway.app |
| Active users | Pre-launch (founder testing) |
| Revenue | $0 |
| Monthly cost | ~$5–8 |
| Development velocity | High — multiple features shipped weekly |
| Launch readiness | Ready for first user cohort |

The product is feature-complete for a v1 launch. It needs real users to validate assumptions — particularly whether the AI lineup feature is compelling enough to pull players away from their WhatsApp-only workflow.

---

## 8. Key Questions for Business Analysis

Please evaluate the following:

1. **Standalone viability.** Is Cancha a viable standalone business, or is it better positioned as a feature within a larger sports platform?

2. **Path to first revenue.** What's the most realistic monetization strategy given the current feature set and target market?

3. **Acquisition vs monetization timing.** Should the founder focus entirely on user acquisition before thinking about revenue, or should monetization be built in from day one?

4. **Product-market fit threshold.** What's the minimum number of active groups/players needed to validate that Cancha solves a real problem people will pay for?

5. **AI moat defensibility.** How defensible is the AI lineup balancing as a competitive advantage? What would make it more defensible?

6. **Casual vs organized.** Should Cancha target organized amateur leagues (higher willingness to pay, more complex needs) or stay focused on casual pickup games (larger market, harder to monetize)?

7. **Partnership opportunities.** What partnerships could accelerate growth — court rental platforms, local leagues, sports brands, or fitness apps?

8. **Geographic strategy.** Is starting in LATAM (Mexico, Chile, Argentina) the right call, or should it go global/English from the start?

9. **Portfolio fit.** Given the founder's goal of reaching $10k/month income (currently at $4.3k from other ventures), how should Cancha fit into the portfolio? Is it worth dedicating significant time to, or should it remain a side project until other ventures close the income gap?

10. **Growth mechanics.** What viral/organic growth loops could Cancha exploit given that soccer groups are inherently social and word-of-mouth driven?

---

## 9. Founder Context

**Andrés Johnson** — Chilean, based in Chile. Product manager by trade (currently at myHotel, a CX SaaS for hotels). Entrepreneur running multiple side ventures:

- **Primary income goal:** $10,000 USD/month
- **Current stable income:** ~$4,300/month (salary + advisory + rental income)
- **Income gap:** ~$5,700/month

**Active ventures:**
- **Vendetech** (primary bet) — a distributor marketplace where people sell SaaS subscriptions and earn commission. Currently in proof-of-concept phase with 10 interested distributors.
- **Quant4x** (lottery ticket) — a Delaware C-Corp in algorithmic sports betting, aiming for a $10–20M exit within a year.
- **Cancha** (passion project) — not currently part of the income strategy, but has the potential to become one.

**Building approach:** Solo developer using AI-powered coding tools (Anthropic's Claude Code), which enables shipping production-quality features at a pace typically requiring a small team. The entire Cancha product was built by one person in weeks, not months.

**Key question for the analyst:** Given limited time and the priority of closing the $5.7k income gap, how much time (if any) should Andrés invest in Cancha vs. doubling down on Vendetech?
