import admin from "firebase-admin";
import { db } from "./db";
import { deviceTokens } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

export function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  const serviceKeyJson = process.env.FCM_SERVICE_KEY;
  if (!serviceKeyJson) {
    console.warn("FCM_SERVICE_KEY environment variable not set. Push notifications will be disabled.");
    return null;
  }

  try {
    const serviceKey = JSON.parse(serviceKeyJson);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceKey),
    });
    console.log("Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return null;
  }
}

interface SendNotificationOptions {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  platform: "android" | "ios";
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a notification to a specific device token via FCM
 */
export async function sendNotification(
  options: SendNotificationOptions
): Promise<NotificationResult> {
  const app = firebaseApp || initializeFirebase();
  if (!app) {
    return {
      success: false,
      error: "Firebase not initialized",
    };
  }

  try {
    const messaging = admin.messaging(app);

    // Prepare the message with platform-specific options
    const message: admin.messaging.Message = {
      token: options.deviceToken,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data || {},
    };

    // Add platform-specific headers
    if (options.platform === "android") {
      message.android = {
        priority: "high",
        notification: {
          title: options.title,
          body: options.body,
          channelId: "default",
        },
      };
    } else if (options.platform === "ios") {
      message.apns = {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: options.title,
              body: options.body,
            },
            sound: "default",
          },
        },
      };
    }

    const messageId = await messaging.send(message);
    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error("Failed to send notification:", error);

    // Mark token as inactive if it's invalid
    if (error.code === "messaging/invalid-registration-token") {
      try {
        await db
          .update(deviceTokens)
          .set({ isActive: false })
          .where(eq(deviceTokens.deviceToken, options.deviceToken));
        console.log(`Marked invalid token as inactive: ${options.deviceToken}`);
      } catch (dbError) {
        console.error("Failed to mark token as inactive:", dbError);
      }
    }

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Send notifications to multiple device tokens
 */
export async function sendNotificationBatch(
  deviceTokens: Array<{ token: string; platform: "android" | "ios" }>,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sentCount: number; failedCount: number; errors: string[] }> {
  const results = await Promise.all(
    deviceTokens.map((device) =>
      sendNotification({
        deviceToken: device.token,
        title,
        body,
        data,
        platform: device.platform,
      })
    )
  );

  const sentCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const errors = results
    .filter((r) => !r.success && r.error)
    .map((r) => r.error || "Unknown error");

  return {
    sentCount,
    failedCount,
    errors,
  };
}

/**
 * Get active device tokens for a user
 */
export async function getActiveDeviceTokensForUser(
  userId: string
): Promise<Array<{ token: string; platform: "android" | "ios" }>> {
  try {
    const tokens = await db
      .select({
        token: deviceTokens.deviceToken,
        platform: deviceTokens.platform as any,
      })
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId) && eq(deviceTokens.isActive, true) as any);

    return tokens as Array<{ token: string; platform: "android" | "ios" }>;
  } catch (error) {
    console.error("Failed to get device tokens:", error);
    return [];
  }
}

/**
 * Get all active device tokens (for broadcast notifications)
 */
export async function getAllActiveDeviceTokens(): Promise<
  Array<{ token: string; platform: "android" | "ios" }>
> {
  try {
    const tokens = await db
      .select({
        token: deviceTokens.deviceToken,
        platform: deviceTokens.platform as any,
      })
      .from(deviceTokens)
      .where(eq(deviceTokens.isActive, true));

    return tokens as Array<{ token: string; platform: "android" | "ios" }>;
  } catch (error) {
    console.error("Failed to get all device tokens:", error);
    return [];
  }
}

// Log all notification sends for debugging
export async function logNotificationSend(
  title: string,
  body: string,
  sentCount: number,
  failedCount: number
) {
  console.log(`[NOTIFICATION_SENT] Title: ${title}, Body: ${body}, Sent: ${sentCount}, Failed: ${failedCount}`);
}
