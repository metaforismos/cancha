# Cancha — Spec de Implementación para Claude Code

> **Contexto**: Lee `CLAUDE.md` para tech stack y estructura. Lee `docs/SCALABILITY_REVIEW.md` para el análisis completo. Este documento es la spec ejecutable.

---

## Convenciones obligatorias

- Todo el UI en **español**
- Mobile-first (375px+), dark mode default
- Componentes: shadcn/ui + Tailwind CSS 4 + Lucide icons
- DB: Drizzle ORM sobre PostgreSQL. Migraciones con `npx drizzle-kit generate` + `npx drizzle-kit migrate`
- Validación: Zod para todo input
- API: Route Handlers en `src/app/api/`
- Auth: `getSession()` de `src/lib/auth.ts` devuelve `{session, player}` o `null`
- Formato fechas: helpers en `src/lib/format.ts`
- No instalar dependencias pesadas sin justificación. Preferir APIs nativas del browser (Web Push API, Share API, etc.)

---

## SPRINT 1 — RETENCIÓN

### 1.1 Push Notifications

**Objetivo**: Que los usuarios reciban notificaciones del browser cuando ocurren eventos importantes.

#### DB: Nueva tabla `push_subscriptions`

```typescript
// src/lib/db/schema.ts — agregar:

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_push_subs_player_id").on(table.playerId),
    uniqueIndex("unique_push_endpoint").on(table.endpoint),
  ]
);
```

#### Env vars nuevas

```
VAPID_PUBLIC_KEY=   # Generar con web-push: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@getcancha.app
```

#### Dependencia

```bash
npm install web-push
npm install -D @types/web-push
```

#### API: 2 endpoints nuevos

**`POST /api/push/subscribe`**
- Body: `{ endpoint, keys: { p256dh, auth } }`
- Auth: requiere session
- Upsert en `push_subscriptions` (por endpoint unique)
- Return 201

**`DELETE /api/push/subscribe`**
- Body: `{ endpoint }`
- Auth: requiere session
- Delete de `push_subscriptions` donde endpoint match
- Return 200

#### Util: `src/lib/notifications.ts`

```typescript
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type NotificationType =
  | "match_created"        // Partido nuevo en tu club
  | "enrollment_update"    // Alguien se inscribió/salió
  | "match_full"           // Partido lleno (para admin)
  | "lineup_published"     // Lineup publicado
  | "match_reminder"       // 24h antes del partido
  | "waitlist_promoted"    // Pasaste de waitlist a inscrito
  | "new_rating"           // Alguien te calificó
  | "result_posted"        // Resultado registrado
  | "attendance_confirm";  // "¿Sigues yendo?"

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url: string;        // Deep link al abrir
  matchId?: string;
  icon?: string;       // Default: /icons/icon-192x192.png
}

// Enviar a un jugador específico
export async function sendPushToPlayer(
  playerId: string,
  payload: NotificationPayload
): Promise<void> {
  // 1. Query push_subscriptions WHERE playerId
  // 2. Para cada subscription, webpush.sendNotification()
  // 3. Si falla con 410 Gone, borrar la subscription
}

// Enviar a todos los miembros de un club
export async function sendPushToClub(
  groupId: string,
  payload: NotificationPayload,
  excludePlayerId?: string  // No notificar al que hizo la acción
): Promise<void> {
  // 1. Query group_members JOIN push_subscriptions
  // 2. Batch sendNotification
}

// Enviar a todos los inscritos de un partido
export async function sendPushToMatchPlayers(
  matchId: string,
  payload: NotificationPayload,
  excludePlayerId?: string
): Promise<void> {
  // 1. Query match_enrollments WHERE status='enrolled' JOIN push_subscriptions
  // 2. Batch sendNotification
}
```

#### Service Worker: Agregar push handler

En `src/app/sw.ts`, **antes** de `serwist.addEventListeners()`:

```typescript
self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() as NotificationPayload;
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    (self as unknown as ServiceWorkerGlobalScope).clients.openWindow(url)
  );
});
```

#### UI: Banner de activación

Crear `src/components/push-prompt.tsx`:
- Mostrar un banner en la parte superior del home si el usuario NO tiene push habilitado
- Texto: "Activa notificaciones para saber cuándo hay partido"
- Botón "Activar" → `Notification.requestPermission()` → si granted, `pushManager.subscribe()` → POST a `/api/push/subscribe`
- Botón "Ahora no" → ocultar el banner (guardar en localStorage)
- Mostrar de nuevo después de 7 días si no activó

#### Puntos de disparo (dónde enviar notificaciones)

Agregar llamadas a `sendPush*` en los endpoints existentes:

| Endpoint | Trigger | Función | Payload |
|----------|---------|---------|---------|
| `POST /api/matches` | Partido creado | `sendPushToClub(groupId, ...)` | "⚽ Nuevo partido el {fecha} en {lugar}" |
| `POST /api/enrollments` | Jugador se inscribe | `sendPushToPlayer(match.createdBy, ...)` | "{nombre} se inscribió a tu partido" |
| `POST /api/enrollments` | Partido lleno | `sendPushToPlayer(match.createdBy, ...)` | "¡Tu partido está lleno! ({count}/{max})" |
| `DELETE /api/enrollments` | Jugador se sale + hay waitlist | `sendPushToPlayer(firstWaitlisted, ...)` | "¡Se abrió un lugar! Ya estás inscrito" |
| `POST /api/lineup/generate` (cuando published=true) | Lineup publicado | `sendPushToMatchPlayers(matchId, ...)` | "Tu equipo para el {fecha} está listo" |
| `POST /api/ratings` | Rating nuevo | `sendPushToPlayer(ratedId, ...)` | "{rater} te calificó" |

**IMPORTANTE**: La promoción de waitlist (cuando alguien se sale y el primer waitlisted sube a enrolled) debe ser **atómica** en el `DELETE /api/enrollments`:
1. Eliminar enrollment del jugador
2. Query primer waitlisted (ORDER BY joinedAt ASC)
3. UPDATE su status a 'enrolled'
4. Enviar push notification

---

### 1.2 Status Visual del Partido

**Objetivo**: En el feed y en el detalle, mostrar visualmente cuántos lugares quedan y si el partido está en riesgo.

#### Componente: `src/components/match-status-badge.tsx`

Props: `{ enrolled: number, maxPlayers: number, enrollmentDeadline: string, matchDate: string }`

Lógica de display:
- `enrolled >= maxPlayers` → Badge verde: "Completo"
- `enrolled >= maxPlayers * 0.8` → Badge amarillo: "Quedan {n} lugares"
- `enrolled >= maxPlayers * 0.6` → Badge naranja: "Faltan {n} jugadores"
- `enrolled < maxPlayers * 0.6` → Badge rojo: "En riesgo ({enrolled}/{maxPlayers})"

Agregar countdown si `enrollmentDeadline` es en las próximas 24h:
- "Cierra en {X}h {Y}m" — actualizar cada minuto con `useEffect` + `setInterval`

#### Dónde usarlo

1. `src/components/match-feed.tsx` — En cada card de partido
2. `src/app/(main)/matches/[id]/page.tsx` — En el header del detalle

#### Indicador de momentum (opcional pero high-impact)

En el detalle del partido, si hay ≥3 inscripciones en las últimas 2 horas, mostrar:
"🔥 {n} inscritos en las últimas 2 horas"

Query: `SELECT COUNT(*) FROM match_enrollments WHERE match_id = $1 AND joined_at > NOW() - INTERVAL '2 hours'`

---

### 1.3 Confirmación de Asistencia

#### DB: Nuevo campo en `match_enrollments`

```typescript
// Agregar a la tabla match_enrollments:
confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
// null = no confirmado, timestamp = confirmado
```

#### Nuevo enum status

Agregar valor `"confirmed"` al `enrollmentStatusEnum`:

```typescript
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "enrolled",
  "confirmed",
  "waitlisted",
  "removed",
]);
```

#### API: `PATCH /api/enrollments/confirm`

```
PATCH /api/enrollments/confirm
Body: { matchId: string }
Auth: requiere session
```

- Actualiza `status = 'confirmed'`, `confirmedAt = now()`
- Solo si el partido es en las próximas 48h y el jugador está enrolled
- Return 200

#### Lógica de auto-waitlist (cron o on-request)

Crear `src/lib/attendance.ts`:

```typescript
export async function processUnconfirmedPlayers(matchId: string): Promise<void> {
  // 1. Si el partido es en <12h:
  // 2. Buscar enrolled (no confirmed) inscritos hace >24h
  // 3. Mover a waitlist
  // 4. Promover primer waitlisted a enrolled
  // 5. Enviar push a ambos jugadores
}
```

Ejecutar esta lógica en `GET /api/matches/[id]` (ya hace `autoUpdateMatchStatus`).

#### UI en detalle del partido

Para cada jugador enrolled, mostrar:
- ✅ Confirmado (verde)
- ⏳ Sin confirmar (gris)

Para el jugador actual, si el partido es en <48h y no ha confirmado:
- Botón prominente: "Confirmar asistencia"
- Texto: "Confirma antes de las {hora} o tu lugar se libera"

#### Push notification de confirmación

24h antes del partido, enviar a todos los enrolled no confirmados:
"¿Sigues yendo mañana? Confirma tu asistencia o tu lugar se libera en 12h"

**Nota**: Esto requiere un cron job. Dos opciones:
1. **Railway cron**: Crear un endpoint `POST /api/cron/reminders` protegido con un CRON_SECRET env var. Railway lo llama cada hora.
2. **On-request**: Cada vez que alguien abre el detalle del partido, revisar si hay reminders pendientes. Menos confiable pero sin infra extra.

Recomendación: Railway cron. Crear `POST /api/cron/attendance`:
- Header: `Authorization: Bearer {CRON_SECRET}`
- Buscar todos los partidos en las próximas 24-48h
- Enviar reminders a los no confirmados
- Ejecutar `processUnconfirmedPlayers` para partidos en <12h

---

### 1.4 Leaderboard por Club

#### API: `GET /api/groups/[id]/leaderboard`

Query params: `?period=month|all` (default: month)

Response:
```json
{
  "goals": [{ "playerId": "...", "name": "...", "count": 5 }],
  "assists": [{ "playerId": "...", "name": "...", "count": 3 }],
  "mvps": [{ "playerId": "...", "name": "...", "count": 2 }],
  "matchesPlayed": [{ "playerId": "...", "name": "...", "count": 8 }],
  "streak": [{ "playerId": "...", "name": "...", "count": 5 }]
}
```

SQL para goleadores (ejemplo):
```sql
SELECT me.player_id, p.name, COUNT(*) as count
FROM match_events me
JOIN matches m ON m.id = me.match_id
JOIN players p ON p.id = me.player_id
WHERE m.group_id = $1
  AND me.type = 'goal'
  AND m.date >= $2  -- inicio del periodo
GROUP BY me.player_id, p.name
ORDER BY count DESC
LIMIT 10
```

Similar para assists, mvp_vote, etc.

**Racha de partidos**: Requiere query más compleja. Buscar los últimos N partidos completados del club, ver cuáles de esos el jugador estuvo enrolled, contar la racha desde el más reciente hacia atrás.

#### UI: Nueva página `src/app/(main)/clubs/[id]/leaderboard/page.tsx`

- Tabs: "Goles" | "Asistencias" | "MVPs" | "Partidos" | "Racha"
- Toggle: "Este mes" / "Histórico"
- Lista con avatar, nombre, número
- Top 3 con medalla (🥇🥈🥉)
- Link desde la página del club

#### UI: Widget en club detail

En `src/app/(main)/clubs/[id]/page.tsx`, agregar una sección "Líderes del mes" con el top 1 de cada categoría. Link a "/clubs/[id]/leaderboard".

---

## SPRINT 2 — GROWTH

### 2.1 Share Optimizado para WhatsApp

#### Función util: `src/lib/share.ts`

```typescript
export function buildMatchShareMessage(match: {
  date: Date;
  location: string;
  format: string;
  enrolled: number;
  maxPlayers: number;
  id: string;
}): string {
  const dateStr = formatDate(match.date); // usa src/lib/format.ts
  const spotsLeft = match.maxPlayers - match.enrolled;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getcancha.up.railway.app";

  return [
    `⚽ Partido ${match.format} el ${dateStr}`,
    `📍 ${match.location}`,
    spotsLeft > 0
      ? `🔥 ${spotsLeft === 1 ? "¡Queda 1 lugar!" : `Quedan ${spotsLeft} lugares`}`
      : "✅ Completo (waitlist abierta)",
    "",
    `Inscríbete: ${baseUrl}/matches/${match.id}`,
  ].join("\n");
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
```

#### UI: Botón de share mejorado

En `src/app/(main)/matches/[id]/page.tsx`, reemplazar el share button actual con:

1. Botón principal: "Compartir por WhatsApp" (ícono de WhatsApp de Lucide o SVG inline)
   - Abre `whatsappUrl(buildMatchShareMessage(match))`
2. Botón secundario: "Copiar link" (clipboard)
3. Si `navigator.share` disponible: usar Web Share API como fallback

#### Post-creación de partido: modal de share

Después de `POST /api/matches` exitoso, en vez de redirigir directo al detalle:
1. Mostrar un dialog/sheet: "¡Partido creado! Compártelo para que se llene"
2. Botón grande: "Enviar por WhatsApp"
3. Botón secundario: "Copiar link"
4. Link: "Ir al partido" (para saltarse el share)

#### Lineup como imagen (exportar SVG → PNG)

En `src/app/(main)/matches/[id]/lineup/page.tsx`:

1. Instalar `html-to-image` o usar canvas nativo:
```bash
npm install html-to-image
```

2. Botón "Compartir lineup":
   - Convertir el `PitchView` SVG a PNG con `toPng()` de html-to-image
   - Si `navigator.share` soporta files: `navigator.share({ files: [pngFile] })`
   - Fallback: descargar la imagen

---

### 2.2 Onboarding Mejorado

#### Flujo post-login para jugadores nuevos

Actualmente: login → redirect a `/profile` si no tiene nombre.

Nuevo flujo (modificar `src/app/middleware.ts` y `/profile/page.tsx`):

1. **Login** → Si jugador nuevo (sin nombre):
2. **Paso 1**: Nombre + alias + foto (ya existe en profile)
3. **Paso 2**: Posición y pie dominante (ya existe)
4. **Paso 3 (nuevo)**: "¿Cómo quieres empezar?"
   - "Tengo un club" → Mostrar campo para pegar invite link o buscar club
   - "Quiero unirme a un partido" → Redirect al mercado de jugadores (Sprint 2.3)
   - "Quiero crear un club" → Redirect a crear club

#### Flujo post-invite

Si el jugador llegó por invite de club (`INVITE_CLUB` cookie):
- Después del setup de perfil, redirect al club, NO al home
- Mostrar los próximos partidos del club directamente

#### Empty states

Crear `src/components/empty-state.tsx`:

```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}
```

Usar en:
- Home sin partidos: "No hay partidos próximos. ¡Crea el primero!" + botón crear
- Club sin partidos: "Este club no tiene partidos. ¿Organizas uno?" + botón crear
- Club sin miembros (más allá del admin): "Invita jugadores a tu club" + botón compartir

---

### 2.3 Mercado de Jugadores ("Se busca")

**Concepto**: Feed público donde aparecen partidos que necesitan jugadores. Cualquier usuario puede ver y unirse, no solo miembros del club.

#### DB: Nuevo campo en `matches`

```typescript
// Agregar a matches:
isPublic: boolean("is_public").notNull().default(false),
```

Cuando el admin crea un partido y activa "Publicar en el mercado", `isPublic = true`.

#### API: `GET /api/matches/public`

- No requiere ser miembro del club
- Filtros: format, city, date range
- Solo partidos con `isPublic = true` y `status = 'open'` y `enrolled < maxPlayers`
- Ordenar por fecha ASC (los más próximos primero)

#### UI: Nueva tab "Buscar partido" en el home

En `src/app/(main)/page.tsx`:
- Tab 1: "Mis partidos" (feed actual, partidos de tus clubs)
- Tab 2: "Buscar partido" (feed público)

Cada card muestra: fecha, lugar, formato, club, "Faltan {n} jugadores", botón "Unirme".

Al unirse a un partido público, el jugador NO se une al club automáticamente.

#### UI: Toggle en crear partido

En `src/app/(main)/matches/new/page.tsx`:
- Nuevo switch: "Publicar en el mercado" (default off)
- Descripción: "Jugadores fuera de tu club podrán ver e inscribirse"

---

### 2.4 Referral Tracking Visible

#### DB: Nuevo campo en `players`

```typescript
// Agregar a players:
referredBy: uuid("referred_by").references(() => players.id),
```

#### Lógica

En `POST /api/auth` (login), si existe cookie `INVITE_REF`:
- Al crear el jugador nuevo, guardar `referredBy = inviteRefPlayerId`
- Borrar la cookie

#### API: `GET /api/players/[id]/referrals`

- Contar `SELECT COUNT(*) FROM players WHERE referred_by = $1`
- Listar los referidos con nombre y fecha

#### UI: En el perfil

Sección "Jugadores que invitaste: {count}". Si count > 0, listar.

Botón "Invitar amigos" → genera link `{baseUrl}/invite/user/{playerId}` → share nativo o WhatsApp.

---

## SPRINT 3 — ENGAGEMENT

### 3.1 Badges/Insignias

#### DB: Nueva tabla `player_badges`

```typescript
export const badgeTypeEnum = pgEnum("badge_type", [
  "first_match",        // Primer partido jugado
  "matches_10",         // 10 partidos
  "matches_50",         // 50 partidos
  "matches_100",        // 100 partidos
  "top_scorer_month",   // Goleador del mes
  "top_assist_month",   // Más asistencias del mes
  "mvp_3",              // MVP 3 veces
  "mvp_10",             // MVP 10 veces
  "streak_5",           // Racha de 5 partidos
  "streak_10",          // Racha de 10 partidos
  "referrals_5",        // Invitaste 5 jugadores
  "referrals_20",       // Invitaste 20 jugadores
  "reliable",           // 90%+ reliability score en 10+ partidos
  "club_founder",       // Creaste un club
]);

export const playerBadges = pgTable(
  "player_badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    badge: badgeTypeEnum("badge").notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
    // meta puede guardar contexto: { month: "2026-03", groupId: "..." }
  },
  (table) => [
    uniqueIndex("unique_player_badge").on(table.playerId, table.badge),
    index("idx_player_badges_player_id").on(table.playerId),
  ]
);
```

#### Badge checker: `src/lib/badges.ts`

```typescript
export async function checkAndAwardBadges(playerId: string): Promise<string[]> {
  // 1. Contar partidos jugados (match_enrollments JOIN matches WHERE status='completed')
  // 2. Contar MVPs (match_events WHERE type='mvp_vote')
  // 3. Contar referidos (players WHERE referred_by)
  // 4. Calcular racha
  // 5. Para cada threshold, verificar si ya tiene el badge
  // 6. Si no, INSERT en player_badges
  // 7. Retornar array de badges nuevos
}
```

Llamar `checkAndAwardBadges` después de:
- Partido completado (en `autoUpdateMatchStatus` o resultado registrado)
- Nuevo referido registrado
- Club creado

#### UI: Badges en perfil

En `src/app/(main)/players/[id]/page.tsx`:
- Sección "Insignias" con iconos (Lucide icons mapeados a cada badge)
- Badges no obtenidas en gris/silhouette como teaser
- Tooltip con nombre y fecha de obtención

---

### 3.2 Historial de Partidos (Timeline)

#### API: `GET /api/players/[id]/history`

Query params: `?page=1&limit=20`

Response:
```json
{
  "summary": {
    "totalMatches": 23,
    "wins": 14,
    "draws": 3,
    "losses": 6,
    "goals": 8,
    "assists": 5,
    "mvps": 3,
    "avgRating": 7.2
  },
  "matches": [
    {
      "matchId": "...",
      "date": "2026-03-15",
      "location": "Cancha Los Olivos",
      "format": "7v7",
      "result": { "scoreA": 4, "scoreB": 2 },
      "playerTeam": "A",
      "won": true,
      "events": [
        { "type": "goal", "count": 2 },
        { "type": "mvp_vote", "count": 1 }
      ]
    }
  ]
}
```

SQL: Join matches + match_enrollments + lineups (para saber en qué equipo jugó) + match_results + match_events.

Determinar equipo del jugador: buscar su playerId en `lineups.teamA.players` o `lineups.teamB.players` (JSONB query).

#### UI: Nueva página `src/app/(main)/players/[id]/history/page.tsx`

- Header con summary stats (cards compactos)
- Timeline vertical con cada partido
- Cada entry: fecha, rival, resultado, iconos de eventos (⚽ gol, 🅰️ asistencia, ⭐ MVP)
- Paginación infinite scroll o "Cargar más"
- Link desde el perfil del jugador

---

### 3.3 Reliability Score

#### Cálculo

```
reliability = (partidos confirmados Y asistió) / (total partidos donde estuvo enrolled) * 100
```

Requiere saber si "asistió" realmente. Dos opciones:
1. **Proxy**: Si tiene enrollment `confirmed` y el partido tiene resultado → asumimos que asistió
2. **Check-in manual (más preciso)**: El admin marca quién realmente llegó post-partido

Recomendación: Empezar con proxy (opción 1), migrar a check-in cuando exista.

#### DB: Nuevo campo en `players` (cached)

```typescript
// Agregar:
reliabilityScore: integer("reliability_score"), // 0-100, null = sin data suficiente
reliabilityMatches: integer("reliability_matches").default(0), // partidos considerados
```

Recalcular periódicamente o en cada partido completado.

#### UI

- En perfil del jugador: barra de progreso con porcentaje
- Color: ≥90 verde, ≥70 amarillo, <70 rojo
- Label: "Confiabilidad" con tooltip explicando qué mide
- En la lista de inscritos del partido: icono de confiabilidad al lado de cada jugador

---

### 3.4 Split de Costos

#### DB: Nuevos campos y tabla

```typescript
// Agregar a matches:
totalCost: integer("total_cost"),           // Costo total en centavos (evitar floats)
currency: text("currency").default("MXN"),  // MXN, CLP, ARS

// Nueva tabla:
export const matchPayments = pgTable(
  "match_payments",
  {
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    amount: integer("amount").notNull(),     // Centavos
    paid: boolean("paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    markedBy: uuid("marked_by")             // Admin que marcó como pagado
      .references(() => players.id),
  },
  (table) => [
    uniqueIndex("unique_match_payment").on(table.matchId, table.playerId),
  ]
);
```

#### API

**`GET /api/matches/[id]/payments`**
- Lista de jugadores con amount, paid status
- Solo admin del club o el jugador mismo

**`PATCH /api/matches/[id]/payments`**
- Body: `{ playerId, paid: boolean }`
- Solo admin del club
- Marca como pagado/no pagado

#### Lógica de cálculo

Cuando el admin pone `totalCost`:
- `costPerPlayer = Math.ceil(totalCost / enrolledCount)`
- Auto-crear/actualizar registros en `matchPayments` para cada enrolled

Recalcular cuando cambia el número de inscritos.

#### UI

En detalle del partido (admin view):
- Sección "Costos": "${totalCost/100} total → ${costPerPlayer/100} por persona"
- Lista: jugador | monto | ✅ pagó / ❌ debe | botón toggle

En detalle del partido (player view):
- "Te toca: ${amount/100}" con badge pagado/pendiente

En perfil del jugador:
- "Debes ${totalDebt/100} de {n} partidos" si tiene pagos pendientes

---

## SPRINT 4 — INFRAESTRUCTURA

### 4.1 Rate Limiting

Instalar:
```bash
npm install rate-limiter-flexible
```

Crear `src/lib/rate-limit.ts`:

```typescript
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

// Limiter para Claude API: 20 por hora global
export const claudeLimiter = new RateLimiterMemory({
  points: 20,
  duration: 3600,
});
```

Agregar check en los handlers:
```typescript
import { generalLimiter } from "@/lib/rate-limit";

// Al inicio de cada route handler:
const ip = request.headers.get("x-forwarded-for") ?? "unknown";
try {
  await generalLimiter.consume(ip);
} catch {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

**Prioridad**: Aplicar `authLimiter` en `POST /api/auth` y `claudeLimiter` en `POST /api/lineup/generate`. El general puede esperar.

### 4.2 Cache Headers

En endpoints que cambian poco, agregar headers:

```typescript
// GET /api/groups, GET /api/players/[id]
return Response.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
});
```

Para datos que cambian frecuentemente (enrollments, match detail):
```typescript
"Cache-Control": "private, no-cache"
```

### 4.3 Paginación Completa

Endpoints que necesitan paginación cursor-based o offset:
- `GET /api/groups/[id]/members` — actualmente sin paginación
- `GET /api/players` — tiene limit pero no offset
- `GET /api/matches` — necesita paginación para historial

Patrón estándar:
```typescript
// Query params: ?page=1&limit=20
const page = parseInt(searchParams.get("page") ?? "1");
const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
const offset = (page - 1) * limit;

const [items, [{ total }]] = await Promise.all([
  db.select().from(table).limit(limit).offset(offset),
  db.select({ total: count() }).from(table),
]);

return Response.json({
  data: items,
  pagination: { page, limit, total: Number(total), pages: Math.ceil(Number(total) / limit) },
});
```

### 4.4 Query Optimization

**`getPlayerAvgSkills`** actualmente hace aggregation en JS. Reescribir como SQL:

```sql
SELECT
  pr.rated_id as player_id,
  AVG((pr.skills->>'pace')::float) as pace,
  AVG((pr.skills->>'shooting')::float) as shooting,
  AVG((pr.skills->>'passing')::float) as passing,
  AVG((pr.skills->>'dribbling')::float) as dribbling,
  AVG((pr.skills->>'defending')::float) as defending,
  AVG((pr.skills->>'physical')::float) as physical,
  AVG((pr.skills->>'heading')::float) as heading,
  COUNT(*) as rating_count
FROM player_ratings pr
WHERE pr.rated_id = $1
GROUP BY pr.rated_id
```

Usar `sql` template de Drizzle para queries raw cuando el ORM se queda corto.

**`autoUpdateMatchStatus`**: Mover de on-request a cron. Crear `POST /api/cron/match-status`:
- Ejecutar cada 15 minutos via Railway cron
- Query todos los partidos con status 'open' cuya fecha ya pasó → 'in_progress'
- Query partidos 'in_progress' cuyo endTime ya pasó → 'completed'
- Proteger con CRON_SECRET header

---

## SPRINT 5 — ANALYTICS (bonus)

### PostHog Integration

```bash
npm install posthog-js
```

Crear `src/lib/analytics.ts`:

```typescript
import posthog from "posthog-js";

export function initAnalytics() {
  if (typeof window === "undefined") return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: true,
  });
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}
```

Eventos a trackear:
- `match_created` — con format, groupId
- `enrollment_joined` — con matchId, isPublicMatch
- `enrollment_left` — con matchId
- `lineup_generated` — con matchId
- `lineup_shared` — con matchId, shareMethod (whatsapp/clipboard)
- `rating_given` — con ratedId
- `attendance_confirmed` — con matchId
- `invite_sent` — con method (whatsapp/clipboard)
- `push_enabled` / `push_dismissed`

Env var nueva: `NEXT_PUBLIC_POSTHOG_KEY`

Inicializar en `src/app/layout.tsx` con un client component wrapper.

---

## Orden de ejecución sugerido

Cada ítem es una tarea independiente que se puede hacer en una sesión:

1. Push notifications (tabla + API + service worker + banner + triggers) — es la base para todo
2. Match status badges + countdown — visual, rápido, alto impacto
3. Share WhatsApp mejorado + post-creation modal — growth inmediato
4. Confirmación de asistencia (schema + API + UI + cron) — resuelve dolor real
5. Leaderboard por club (API + página) — gamification starter
6. Mercado de jugadores (isPublic + API + tab en home) — growth
7. Onboarding mejorado (flujo + empty states) — retención nuevos
8. Referral tracking (schema + UI en perfil) — growth metric
9. Badges (tabla + checker + UI en perfil) — engagement
10. Historial/timeline del jugador (API + página) — engagement
11. Reliability score (cálculo + UI) — resuelve dolor real
12. Split de costos (tabla + API + UI) — resuelve dolor real
13. Rate limiting — seguridad
14. Cache + paginación + query optimization — performance
15. PostHog analytics — métricas
