# Revisión de Escalabilidad — Cancha

**Fecha:** 2026-03-20
**Objetivo:** Maximizar adopción de usuarios y resolver problemas reales de organización de partidos.

---

## Estado actual: MVP funcional, pero con techo de crecimiento bajo

El producto tiene las bases correctas: PWA instalable, login sin fricción, enrollment con waitlist, y generación de lineups con IA. Pero hay brechas críticas que limitan la retención, el crecimiento orgánico y la experiencia del usuario.

---

## 1. PROBLEMAS CRÍTICOS DE GROWTH

### 1.1 No hay loop viral real

El sistema de invites existe (`/invite/club/[id]`, `/invite/user/[id]`) con OpenGraph, pero no hay **incentivo** para compartir. En apps sociales, el growth viene de que el producto sea inútil sin más gente. Cancha necesita:

- **Invite obligatorio para crear partido**: El admin crea el partido y el siguiente paso debería ser "Compartir con jugadores" (WhatsApp deep link). No es opcional — sin jugadores no hay partido.
- **Referral tracking real**: La cookie `INVITE_REF` existe pero no se usa para nada visible. Debería haber un contador "Jugadores que invitaste" en el perfil.
- **Viral loop del lineup**: Cuando se publica el lineup, cada jugador debería recibir una notificación/link. "Tu equipo para el sábado está listo" es el mensaje más shareable posible.

### 1.2 WhatsApp es el canal, no la app

En LATAM, los partidos se organizan por WhatsApp. Cancha compite con un grupo de WhatsApp. Para ganar:

- **Share nativo optimizado para WhatsApp**: El botón de compartir debería generar un mensaje pre-formateado: "⚽ Partido el sábado 22/3 a las 18:00 en [Cancha X]. Faltan 4 lugares. Inscríbete: [link]"
- **Lineup como imagen**: Generar un PNG/SVG del lineup (la cancha con nombres) para mandar por WhatsApp. El `PitchView` ya renderiza SVG — solo falta exportarlo a imagen.
- **Recordatorios vía link**: Sin un bot de WhatsApp (complejo), al menos generar links de WhatsApp pre-escritos: "Recordar a los inscritos" → abre WhatsApp con mensaje y lista de contactos.

### 1.3 Onboarding incompleto

- Login es solo teléfono → nombre → listo. No hay **tutorial**, no hay **primer partido de ejemplo**, no hay **club sugerido**.
- Un jugador nuevo que llega por invite a un club debería ver inmediatamente los próximos partidos de ese club, no el feed genérico.
- **Falta "empty state" útil**: Si no hay partidos, mostrar "Crea tu primer partido" con un wizard simple, no un formulario frío.

---

## 2. PROBLEMAS DE USABILIDAD QUE MATAN RETENCIÓN

### 2.1 No hay notificaciones

Este es el problema #1. Sin notificaciones:
- No sabes que te anotaron a un partido
- No sabes que se publicó el lineup
- No sabes que alguien te calificó
- No sabes que se llenó el partido y quedaste en waitlist
- No sabes que se abrió un lugar (waitlist → enrolled)

**Implementación mínima viable:**
1. **Push notifications** vía service worker (Serwist ya está). Web Push API + endpoint en el backend para suscripciones.
2. **Eventos que disparan notificación:**
   - Partido creado en tu club
   - Alguien se inscribió/desinscribió
   - Partido lleno (para admin)
   - Lineup publicado
   - Recordatorio 24h antes del partido
   - Waitlist → inscrito (lugar abierto)
   - Alguien te calificó
   - Resultado del partido registrado

### 2.2 Sin feedback en tiempo real

- La página de partido no hace polling ni usa SSE/WebSocket. Si estás viendo el partido y alguien se inscribe, no lo ves hasta que refrescas.
- **Mínimo**: polling cada 30s en la página de detalle del partido. **Ideal**: Server-Sent Events para enrollment count.

### 2.3 Rating gate sin contexto

La API bloquea inscripción con <3 ratings pero el UI no explica esto proactivamente. Un jugador nuevo llega, intenta inscribirse, recibe un 403 y no entiende por qué.

**Fix**: En el perfil y en el botón de inscripción, mostrar "Necesitas 3 calificaciones para inscribirte. Pide a tus compañeros que te califiquen." con link directo al perfil para compartir.

### 2.4 No hay confirmación de asistencia

Problema clásico del fútbol: 10 dicen que van, llegan 7. Cancha necesita:
- **Confirmación 24h antes**: Push notification "¿Sigues yendo mañana?" con botones Sí/No
- **Historial de asistencia**: Tracking de quién confirma y quién realmente va. Esto alimenta un "reliability score".
- **Auto-waitlist**: Si no confirmas 12h antes, tu lugar se libera al siguiente en waitlist.

---

## 3. GAMIFICACIÓN

### 3.1 Lo que existe

- Ratings 1-10 en 7 skills (crowdsourced)
- MVP vote post-partido
- Tracking de goles/asistencias/tarjetas

### 3.2 Lo que falta (ordenado por impacto)

**Tier 1 — Alto impacto, baja complejidad:**

| Feature | Por qué importa |
|---------|-----------------|
| **Leaderboard por club** | Goleador, más asistencias, más MVPs del mes. Genera competencia sana y retención. Los datos ya están en `match_events`. |
| **Racha de partidos** | "Llevas 5 partidos seguidos 🔥". Incentiva asistencia constante. Solo requiere query sobre enrollments + match_results. |
| **Rating público en perfil** | Mostrar el promedio general y por skill en el perfil. Ya se calcula en `getPlayerAvgSkills()` pero no tiene prominencia visual. |
| **Badges/insignias** | "Primer partido", "10 partidos", "Goleador del mes", "MVP x3", "Invitaste 5 jugadores". Tabla nueva `player_badges`. |

**Tier 2 — Medio impacto, media complejidad:**

| Feature | Por qué importa |
|---------|-----------------|
| **Reliability score** | % de partidos confirmados donde realmente fue. Resuelve el problema #1 del fútbol amateur: el que dice que va y no va. |
| **Historial de partidos como timeline** | "Jugaste 23 partidos, ganaste 14, 6 goles, rating promedio 7.2". Cada jugador quiere ver su progreso. |
| **Comparar jugadores** | Side-by-side de skills entre 2 jugadores. Genera engagement y discusión. |
| **Nivel/EXP** | Sistema de XP: +10 por jugar, +5 por calificar, +20 por MVP, +3 por confirmar a tiempo. Niveles visibles en perfil. |

**Tier 3 — Alto impacto, alta complejidad:**

| Feature | Por qué importa |
|---------|-----------------|
| **Temporadas** | Periodos de 2-3 meses con leaderboard que se resetea. Mantiene frescura y da "algo por lo que jugar". |
| **Logros de club** | "Tu club jugó 50 partidos", "Racha de 10 partidos organizados". Incentiva a admins a seguir organizando. |

---

## 4. ESCALABILIDAD TÉCNICA

### 4.1 Base de datos

**Bien:**
- Índices correctos en las queries más frecuentes
- JSONB para skills y lineups (flexible)
- Constraints únicos donde corresponde

**Problemas:**
- `getPlayerAvgSkills()` hace aggregation en JS, no en SQL. Con 1000+ ratings esto será lento. Migrar a una vista materializada o query con `AVG()` en Drizzle.
- No hay paginación real en varios endpoints (e.g., `/api/groups/[id]/members`). Con clubs de 100+ jugadores esto explota.
- `autoUpdateMatchStatus()` se ejecuta en cada GET de partido. Debería ser un cron job o trigger de DB.
- No hay rate limiting en ningún endpoint. Un bot podría crear miles de enrollments.

### 4.2 API & Performance

- **No hay caché**: Cada request va directo a PostgreSQL. Para datos que cambian poco (clubs, player profiles), Redis o al menos cache headers con `stale-while-revalidate`.
- **Claude API**: Max 5 generaciones por partido es bueno, pero no hay rate limiting global. 100 admins generando lineups simultáneamente = $$ en API calls y posible throttling.
- **No hay connection pooling explícito**: `postgres` driver maneja pool internamente pero sin configuración. Con más usuarios necesitarás PgBouncer o configurar pool size.

### 4.3 PWA & Offline

- Assets cached pero datos no. En una cancha sin WiFi (literalmente), no puedes ver tu lineup.
- **Mínimo**: Cache de la última respuesta de cada endpoint crítico (match detail, lineup, enrollments) con IndexedDB.
- Background sync para enrollments offline (inscribirte sin internet, se sincroniza después).

### 4.4 Infra

- Railway hobby plan tiene límites de RAM y CPU. Con Next.js SSR y PostgreSQL en el mismo plan, el ceiling es ~500-1000 usuarios concurrentes.
- **Siguiente paso**: Separar DB del compute. Railway permite esto pero hay que configurarlo.
- **CDN**: No hay configuración explícita de CDN para assets estáticos. Cloudflare o Vercel Edge sería un quick win.

---

## 5. FEATURES FALTANTES PARA RESOLVER PROBLEMAS REALES

### 5.1 El problema del dinero

En LATAM, cada partido tiene un costo (cancha, pecheras, agua). El admin paga y luego cobra. Cancha debería:
- **Split de costos**: Admin pone el costo total → se divide entre inscritos → cada uno ve "Te toca $X"
- **Tracking de pagos**: "Pagó / No pagó" por jugador. No procesar pagos reales (complejo), solo tracking.
- **Deudor visible**: En el perfil, "Debes $X de 2 partidos". Presión social > cobros.

### 5.2 El problema del "falta uno"

- **Mercado de jugadores**: Si al partido le faltan jugadores, publicar en un feed público "Se busca 1 jugador para 7v7 el sábado". Jugadores sin club pueden ver esto y unirse.
- **Suplentes automáticos**: Marcar jugadores como "disponible de último minuto". Si alguien se baja, el sistema ofrece el lugar automáticamente.

### 5.3 El problema de la cancha

- **Directorio de canchas**: Nombre, ubicación (Google Maps link), precio, horarios, fotos. Crowdsourced.
- **Reserva integrada**: Aunque sea solo un link a WhatsApp de la cancha. "Reservar en [Cancha X]" → abre WhatsApp con mensaje pre-escrito.

### 5.4 El problema del "nunca sé si jugamos"

- **Status claro del partido**: "Confirmado (10/10 inscritos)" vs "En riesgo (6/10, faltan 4)" vs "Cancelado". Visible en el feed.
- **Cancelación automática**: Si a 24h del partido hay <60% de inscritos, avisar al admin "¿Cancelar partido?".
- **Indicador de momentum**: "8 inscritos en 2 horas" genera urgencia. "Solo quedan 2 lugares" genera FOMO.

---

## 6. PRIORIZACIÓN RECOMENDADA

### Sprint 1 — Retención (sin esto la gente se va)
1. Push notifications (service worker ya está)
2. Countdown/status visual en partidos ("Faltan 3 lugares", "Cierra en 2h")
3. Confirmación de asistencia 24h antes
4. Leaderboard básico por club

### Sprint 2 — Growth (sin esto no crece)
5. Share optimizado para WhatsApp (mensaje + imagen de lineup)
6. Empty states útiles + onboarding mejorado
7. Mercado de jugadores ("Se busca 1")
8. Referral tracking visible

### Sprint 3 — Engagement (sin esto se aburren)
9. Badges/insignias
10. Historial de partidos como timeline
11. Reliability score
12. Split de costos

### Sprint 4 — Infraestructura (sin esto se cae)
13. Rate limiting
14. Caché (Redis o headers)
15. Paginación completa
16. Optimización de queries (aggregations en SQL)

---

## 7. MÉTRICAS QUE DEBERÍAS TRACKEAR

No tienes analytics. Sin datos no puedes optimizar. Mínimo:

| Métrica | Por qué |
|---------|---------|
| WAU (Weekly Active Users) | Core metric. Si baja, algo está mal. |
| Partidos creados/semana | Si los admins dejan de crear, el producto muere. |
| % enrollment vs capacity | Si los partidos se llenan = producto útil. |
| Tiempo login → primer enrollment | Si es >5min, el onboarding falla. |
| % confirmación → asistencia | Mide el reliability problem. |
| Invites enviados → conversión | Mide el viral loop. |
| Ratings por jugador/semana | Si nadie califica, el AI lineup pierde sentido. |

Implementación: Posthog (free tier) o Plausible (self-hosted). Un `<Script>` en el layout y listo.

---

## Conclusión

Cancha tiene un core sólido pero está diseñada como herramienta, no como red social de fútbol. Para escalar necesita tres cosas: que la gente **vuelva** (notificaciones + gamificación), que la gente **invite** (viral loops + WhatsApp), y que la gente **no pueda vivir sin ella** (resolver el dolor real: confirmación, dinero, "falta uno"). El tech stack aguanta 10x más usuarios con ajustes menores, pero sin las features de retención y growth, no vas a necesitar esa escala.
