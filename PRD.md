# Cancha — Product Requirements Document

**Version:** 1.0
**Date:** March 17, 2026
**Author:** Andres

---

## 1. Problem

Recreational soccer groups coordinate matches via WhatsApp. Two recurring problems: nobody builds the lineups before the match, and when someone does, the teams are unbalanced. This wastes time and ruins the game.

## 2. Solution

Cancha is a mobile-first PWA that lets soccer groups manage match enrollment and automatically generate balanced lineups using player skill data and an LLM (Claude API). Players enroll, rate each other, and the app handles the rest.

## 3. Target Users

- **Players**: Recreational soccer players in WhatsApp groups who play regularly (weekly/biweekly).
- **Admins**: Designated players who create and manage matches. First admin: Andres. Multiple admins per group supported.

## 4. Core User Flows

### 4.1 Registration & Profile

1. User opens Cancha PWA link (shared in WhatsApp group).
2. Enters WhatsApp phone number.
3. Receives OTP via SMS. Verifies.
4. Creates player profile:
   - **Name** (display name)
   - **Position(s)**: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST (multi-select)
   - **Dominant foot**: Left / Right / Both
   - **Skills** (self-assessed, 1-5 scale):
     - Pace
     - Shooting
     - Passing
     - Dribbling
     - Defending
     - Physical
     - Heading
   - **Profile photo** (optional)

### 4.2 Player Ratings (Crowdsourced)

- Any registered player can rate any other player's skills (same 1-5 scale per skill).
- A player's effective rating = average of all ratings received (excluding self).
- **Minimum 3 ratings required** before a player can join a match.
- Players with <3 ratings see a prompt: "Ask teammates to rate you so you can join matches."
- Ratings are anonymous. Players see their average, not individual ratings.

### 4.3 Match Creation (Admin)

1. Admin taps "Create Match".
2. Configures:
   - **Date & time**
   - **Location** (text field + optional Google Maps link)
   - **Format**: 5v5, 7v7, 8v8, 11v11
   - **Max players**: auto-set based on format (10, 14, 16, 22) but editable
3. Match appears in the group feed. Shareable link generated for WhatsApp.

### 4.4 Match Enrollment

1. Player opens match (from app or shared link).
2. Taps "Join Match".
3. If spots available → added to roster.
4. If full → added to waitlist (ordered by join time).
5. If a rostered player leaves → first waitlist player auto-promoted.
6. Admin can manually add/remove players.
7. Enrollment deadline: configurable by admin (default: 2 hours before match).

### 4.5 Lineup Generation

- **Trigger**: Admin taps "Generate Lineups" (available once minimum players enrolled — format × 2).
- **Engine**: Claude API call with structured prompt containing:
  - All enrolled players with their averaged skill ratings, positions, dominant foot.
  - Match format (5v5, 7v7, 11v11, etc.).
  - Instruction to create two balanced teams with formations.
- **Output**:
  - Two teams with named formation (e.g., 4-3-3, 3-5-2).
  - Each player assigned a specific position.
  - Brief justification of balance (overall team rating comparison).
  - Bench/substitute assignments if players exceed format count.
- **Regenerate**: Admin can regenerate if unsatisfied (with option to lock specific players to a team).
- **Publish**: Admin publishes lineups → all enrolled players notified.

### 4.6 Post-Match Tracking

After a match, admin (or any player) can record:
- **Final score**
- **Goal scorers** (with count)
- **Assists**
- **Injuries** (player + type: minor/moderate/serious)
- **MVP vote** (each player votes once)

This data feeds into future lineup balancing context.

## 5. Information Architecture

```
Home (match feed)
├── Upcoming matches
│   ├── Match detail → Enroll / Leave / View lineup
│   └── [Admin] Create match
├── Past matches
│   └── Match detail → Results, stats
├── Players
│   ├── Player list (with search)
│   └── Player profile → Rate skills
├── My Profile
│   └── Edit profile, view my ratings
└── [Admin] Group Settings
    └── Manage admins, group name
```

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Platform | PWA (mobile-first, installable) |
| Performance | <2s first contentful paint on 4G |
| Auth | OTP via SMS (WhatsApp number) |
| LLM | Claude API (Anthropic) |
| Hosting | Railway |
| Budget | Minimal — free tiers where possible |
| Offline | Basic caching for match list |
| Notifications | Push notifications (via service worker) |

## 7. Data Model (Core Entities)

### Player
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| phone | string | WhatsApp number, unique |
| name | string | Display name |
| positions | string[] | Array of position codes |
| dominant_foot | enum | left, right, both |
| self_skills | jsonb | {pace, shooting, passing, dribbling, defending, physical, heading} |
| photo_url | string? | Optional |
| created_at | timestamp | |

### PlayerRating
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| rater_id | uuid | FK → Player |
| rated_id | uuid | FK → Player |
| skills | jsonb | Same structure as self_skills |
| created_at | timestamp | |
| updated_at | timestamp | |

*Unique constraint: (rater_id, rated_id) — one rating per pair, updatable.*

### Group
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | string | Group name |
| created_by | uuid | FK → Player |
| created_at | timestamp | |

### GroupMember
| Field | Type | Notes |
|-------|------|-------|
| group_id | uuid | FK → Group |
| player_id | uuid | FK → Player |
| role | enum | admin, player |

### Match
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| group_id | uuid | FK → Group |
| date | timestamp | Match date/time |
| location | string | Venue name |
| location_url | string? | Maps link |
| format | enum | 5v5, 7v7, 8v8, 11v11 |
| max_players | int | |
| enrollment_deadline | timestamp | |
| status | enum | open, closed, in_progress, completed |
| created_by | uuid | FK → Player |

### MatchEnrollment
| Field | Type | Notes |
|-------|------|-------|
| match_id | uuid | FK → Match |
| player_id | uuid | FK → Player |
| status | enum | enrolled, waitlisted, removed |
| joined_at | timestamp | For waitlist ordering |

### Lineup
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| match_id | uuid | FK → Match |
| team_a | jsonb | {formation, players: [{player_id, position}]} |
| team_b | jsonb | {formation, players: [{player_id, position}]} |
| bench | jsonb | [{player_id}] |
| justification | text | LLM-generated balance explanation |
| published | boolean | |
| created_at | timestamp | |

### MatchResult
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| match_id | uuid | FK → Match |
| score_a | int | |
| score_b | int | |
| created_at | timestamp | |

### MatchEvent
| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| match_id | uuid | FK → Match |
| player_id | uuid | FK → Player |
| type | enum | goal, assist, injury, mvp_vote |
| meta | jsonb | {injury_severity, voted_for, etc.} |

## 8. Claude API — Lineup Prompt Structure

```
You are a soccer coach AI. Generate two balanced teams from the following player pool.

**Match format**: {format}
**Players**: {count}

**Player data**:
| Name | Positions | Foot | Pace | Shot | Pass | Drib | Def | Phys | Head | Avg |
| ...  | ...       | ...  | ...  | ...  | ...  | ...  | ... | ...  | ...  | ... |

**Historical context** (if available):
- Last 5 match results and lineups
- Goal/assist stats

**Instructions**:
1. Create two teams with a named formation each.
2. Assign each player to a specific position matching their profile.
3. Balance teams by overall average rating (max 0.3 difference).
4. Consider position coverage — don't leave gaps.
5. Respect dominant foot for wing positions.
6. Assign bench players if applicable.
7. Return structured JSON.

**Output format**:
{
  "team_a": { "formation": "4-3-3", "players": [{"id": "...", "name": "...", "position": "LW"}] },
  "team_b": { "formation": "4-4-2", "players": [...] },
  "bench": [...],
  "balance": { "team_a_avg": 3.4, "team_b_avg": 3.5 },
  "justification": "..."
}
```

## 9. MVP Scope (v1.0)

**In scope:**
- Player registration with OTP
- Player profiles with skills
- Crowdsourced ratings
- Group creation
- Match creation and enrollment
- LLM lineup generation
- Basic post-match tracking (score, goals)

**Out of scope (v2+):**
- WhatsApp bot integration (auto-enrollment via message)
- Payment/fee splitting
- Player statistics dashboard
- Season/league management
- Chat within app
- Push notification reminders
- WhatsApp share of lineup image
