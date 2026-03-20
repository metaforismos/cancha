# Cancha — Features & Status

## Implemented (v1)

### Core
- Player registration (phone number, country selector MX/CL/AR)
- Player profile (name, positions, dominant foot, self-assessed skills 1-10, alias, shirt number, birth date)
- Crowdsourced player ratings (any player rates any other, 1-10 per skill, one rating per pair)
- Combined rating display (self + peer average)
- Session-based auth (30-day, httpOnly cookies)

### Clubs
- Create clubs (name, location via country-state-city picker, description, logo upload)
- Browse/filter clubs by country and city
- Join/leave clubs
- Club admin: edit info, manage members
- Club detail with member list

### Matches
- Create match (admin): date/time, location, location URL, format, max players, enrollment deadline
- Match feed (home page) with sorting
- Match detail with enrollment count
- Enroll/leave match with waitlist support
- Match status lifecycle: open → closed → in_progress → completed

### Lineups (AI)
- Claude API lineup generation (`claude-sonnet-4-6`)
- Two modes: balanced two-team split, or single best team
- Player locking (lock players to specific team before regeneration)
- Max 5 regenerations per match
- Visual SVG pitch formation display
- Formation names (4-3-3, 4-4-2, etc.)
- AI justification of team balance
- Publish lineup

### Post-Match
- Record final score
- Track goals, assists, injuries (with severity)
- MVP voting

### UI/UX
- Mobile-first (max-w-md container)
- Bottom navigation (Home, Players, Clubs, Profile)
- Dark mode (default)
- Spanish language throughout
- Toast notifications (Sonner)
- PWA: installable, offline caching via Serwist

## Known Gaps (planned in PRD but not yet implemented)

- **Rating gate**: PRD requires ≥3 ratings before joining matches — not enforced
- **SMS/OTP verification**: Auth uses direct phone entry, no SMS verification
- **Push notifications**: Service worker exists but no push notification implementation
- **Enrollment deadline enforcement**: Deadline is stored but not strictly enforced in UI
- **Enrollment cap enforcement**: maxPlayers stored but not enforced on join
- **WhatsApp share**: No shareable lineup image or direct WhatsApp integration
- **Pull-to-refresh**: Not implemented on match feed
- **Offline match list**: Service worker caches assets but not API data

## v2 Backlog (from PRD)

- WhatsApp bot integration (auto-enrollment via message)
- Payment/fee splitting
- Player statistics dashboard
- Season/league management
- In-app chat
- Push notification reminders
- WhatsApp share of lineup image
