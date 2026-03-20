import { db } from "@/lib/db";
import { pushSubscriptions, groupMembers, matchEnrollments } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

// Configure VAPID — gracefully skip if keys not set
const vapidConfigured =
  !!process.env.VAPID_PUBLIC_KEY &&
  !!process.env.VAPID_PRIVATE_KEY &&
  !!process.env.VAPID_SUBJECT;

let webpushModule: typeof import("web-push") | null = null;

/**
 * Lazily load and configure web-push. Returns null if VAPID keys are missing.
 */
async function getConfiguredWebPush(): Promise<typeof import("web-push") | null> {
  if (!vapidConfigured) return null;

  if (!webpushModule) {
    // Dynamic import with variable to prevent Turbopack static analysis
    const moduleName = "web-push";
    const mod = await (Function("m", "return import(m)")(moduleName) as Promise<{
      default: typeof import("web-push");
    }>);
    webpushModule = mod.default;
    webpushModule.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
  }

  return webpushModule;
}

type NotificationType =
  | "match_created"
  | "enrollment_update"
  | "match_full"
  | "lineup_published"
  | "match_reminder"
  | "waitlist_promoted"
  | "new_rating"
  | "result_posted"
  | "attendance_confirm";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  url: string;
  matchId?: string;
  icon?: string;
}

async function sendToSubscriptions(
  webpush: typeof import("web-push"),
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: NotificationPayload
): Promise<void> {
  const payloadStr = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payloadStr
        );
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or invalid — clean up
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, sub.id))
            .catch(() => {});
        }
      }
    })
  );
}

/**
 * Send push notification to a specific player.
 */
export async function sendPushToPlayer(
  playerId: string,
  payload: NotificationPayload
): Promise<void> {
  const webpush = await getConfiguredWebPush();
  if (!webpush) return;

  try {
    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.playerId, playerId));

    if (subs.length > 0) {
      await sendToSubscriptions(webpush, subs, payload);
    }
  } catch {
    // Push failures must never break the main request
  }
}

/**
 * Send push notification to all members of a club.
 */
export async function sendPushToClub(
  groupId: string,
  payload: NotificationPayload,
  excludePlayerId?: string
): Promise<void> {
  const webpush = await getConfiguredWebPush();
  if (!webpush) return;

  try {
    const conditions = [eq(groupMembers.groupId, groupId)];
    if (excludePlayerId) {
      conditions.push(ne(groupMembers.playerId, excludePlayerId));
    }

    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(groupMembers)
      .innerJoin(
        pushSubscriptions,
        eq(groupMembers.playerId, pushSubscriptions.playerId)
      )
      .where(and(...conditions));

    if (subs.length > 0) {
      await sendToSubscriptions(webpush, subs, payload);
    }
  } catch {
    // Push failures must never break the main request
  }
}

/**
 * Send push notification to all enrolled players in a match.
 */
export async function sendPushToMatchPlayers(
  matchId: string,
  payload: NotificationPayload,
  excludePlayerId?: string
): Promise<void> {
  const webpush = await getConfiguredWebPush();
  if (!webpush) return;

  try {
    const conditions = [
      eq(matchEnrollments.matchId, matchId),
      eq(matchEnrollments.status, "enrolled"),
    ];
    if (excludePlayerId) {
      conditions.push(ne(matchEnrollments.playerId, excludePlayerId));
    }

    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(matchEnrollments)
      .innerJoin(
        pushSubscriptions,
        eq(matchEnrollments.playerId, pushSubscriptions.playerId)
      )
      .where(and(...conditions));

    if (subs.length > 0) {
      await sendToSubscriptions(webpush, subs, payload);
    }
  } catch {
    // Push failures must never break the main request
  }
}
