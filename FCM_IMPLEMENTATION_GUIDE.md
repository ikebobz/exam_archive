# Firebase Cloud Messaging (FCM) Implementation Guide

## Overview
This document outlines the complete Firebase Cloud Messaging integration for the Exam Archive application. The implementation enables push notifications for:
- New exams/questions uploads
- Admin broadcast messages to all users

## Files Modified/Created

### 1. Database Schema (`shared/schema.ts`)
- **Added**: `deviceTokens` table to store FCM tokens from mobile apps
- **Fields**:
  - `id`: Primary key
  - `userId`: Foreign key to users table
  - `deviceToken`: Unique FCM token from mobile app
  - `platform`: 'android' or 'ios'
  - `isActive`: Boolean flag to mark tokens as valid
  - `createdAt` / `updatedAt`: Timestamps

### 2. FCM Service (`server/fcm.ts`) - NEW FILE
Handles all Firebase Cloud Messaging operations:
- **`initializeFirebase()`**: Initializes Firebase Admin SDK using `FCM_SERVICE_KEY` env variable
- **`sendNotification(options)`**: Sends notification to a single device
  - Supports platform-specific headers (Android: high priority, iOS: apns-priority 10)
  - Automatically marks invalid tokens as inactive
- **`sendNotificationBatch(deviceTokens, title, body, data)`**: Sends to multiple devices
- **`getActiveDeviceTokensForUser(userId)`**: Retrieves active tokens for a specific user
- **`getAllActiveDeviceTokens()`**: Retrieves all active tokens (for broadcasts)
- **`logNotificationSend()`**: Logs all notification sends for debugging

### 3. Storage Layer (`server/storage.ts`)
Added device token management methods:
- **`registerDeviceToken(userId, token)`**: Creates or updates device token
- **`unregisterDeviceToken(deviceToken)`**: Marks token as inactive on logout
- **`getDeviceTokensForUser(userId)`**: Gets active tokens for a user
- **`getAllActiveDeviceTokens()`**: Gets all active tokens

### 4. API Routes (`server/routes.ts`)

#### Device Management Endpoints
```
POST /api/devices/register
- Authenticate: Required
- Body: { deviceToken: string, platform: 'android'|'ios' }
- Response: { success: true, deviceToken: {...} }

POST /api/devices/unregister
- Authenticate: Required
- Body: { deviceToken: string }
- Response: { success: true }
```

#### Notification Endpoints
```
POST /api/notifications/send
- Authenticate: Required
- Admin check: TODO (implement)
- Body: {
    title: string,
    body: string,
    userId?: string | null,  // null = broadcast to all
    data?: Record<string, string>
  }
- Response: {
    success: true,
    sentCount: number,
    failedCount: number,
    errors: string[]
  }
```

#### Excel Upload Integration
The Excel upload endpoint (`POST /api/questions/upload-excel`) now:
1. Uploads questions as before
2. Sends push notification to all users: "New Questions Available: X questions added to [subject name]"
3. Continues even if notification fails (graceful degradation)

### 5. Dependencies (`package.json`)
- **Added**: `firebase-admin@^12.0.0`

### 6. Cloud Build Configuration (`cloudbuild.yaml`)
- Added FCM_SERVICE_KEY as a Secret Manager secret
- Passes FCM_SERVICE_KEY to Cloud Run deployment
- Database URL continues to be passed as before

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Firebase

1. **Create Firebase Project** (if not already done):
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or select existing

2. **Generate Service Account Key**:
   - In Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file (keep it secure!)

3. **Set Environment Variable**:
   ```bash
   export FCM_SERVICE_KEY=$(cat /path/to/service-account-key.json)
   ```
   Or create `.env` file:
   ```
   FCM_SERVICE_KEY='{"type":"service_account",...}'
   ```

### Step 3: Database Migration
```bash
npm run db:push
```
This will create the `device_tokens` table in your PostgreSQL database.

### Step 4: Deploy to Cloud Run

#### Option A: Using Google Cloud Console
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Create/edit your trigger
3. Add substitution variables:
   - `_SERVICE_NAME`: exam-vault (or your service name)
   - `_REGION`: europe-west3 (or your region)
4. Set up FCM_SERVICE_KEY in Secret Manager:
   ```bash
   gcloud secrets create FCM_SERVICE_KEY --data-file=/path/to/service-account-key.json
   ```

#### Option B: Manual Cloud Build
```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=exam-vault,_REGION=europe-west3 \
  --machine-type=E1_MEDIUM
```

### Step 5: Configure Secret Manager (Cloud Build)
```bash
# Create KMS key ring (if not exists)
gcloud kms keyrings create cloud-build --location=global

# Create KMS key (if not exists)
gcloud kms keys create cloud-build --location=global --keyring=cloud-build --purpose=encryption

# Encrypt and set secret in Cloud Build
gcloud builds create \
  --substitutions=_SERVICE_NAME=exam-vault \
  --config=cloudbuild.yaml
```

## Mobile App Integration

### Android Implementation
1. **Add Firebase SDK** to Android project
2. **Get FCM Token** from FirebaseMessaging:
   ```kotlin
   FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
       val token = task.result
       // Send to backend: POST /api/devices/register
   }
   ```
3. **Handle Notifications**:
   ```kotlin
   // Firebase handles this automatically
   // Notifications appear in system tray
   ```

### iOS Implementation
1. **Add Firebase SDK** to iOS project
2. **Request User Permission** for notifications
3. **Get APNS Token** and FCM Token:
   ```swift
   Messaging.messaging().token { token, error in
       // Send to backend: POST /api/devices/register
   }
   ```
4. **Handle Notifications**:
   ```swift
   // Firebase handles this automatically
   // Notifications appear in notification center
   ```

## Testing

### Test Device Registration
```bash
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "deviceToken": "YOUR_FCM_TOKEN",
    "platform": "android"
  }'
```

### Test Notification Send (User-Specific)
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message",
    "userId": "USER_ID",
    "data": {"action": "open_exam", "examId": "123"}
  }'
```

### Test Broadcast
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "title": "Broadcast Message",
    "body": "This goes to everyone",
    "data": {"priority": "high"}
  }'
```

### Test Device Unregistration
```bash
curl -X POST http://localhost:3000/api/devices/unregister \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "deviceToken": "YOUR_FCM_TOKEN"
  }'
```

## Monitoring & Debugging

### Firebase Console
- Check notification delivery status
- Monitor FCM token registrations
- View error logs

### Application Logs
All notification operations are logged:
```
[NOTIFICATION_SENT] Title: ..., Body: ..., Sent: N, Failed: M
```

Invalid tokens are automatically marked as inactive and logged:
```
Marked invalid token as inactive: <token>
```

## Troubleshooting

### Firebase Not Initialized
- Ensure `FCM_SERVICE_KEY` environment variable is set correctly
- Check that service account key JSON is valid
- Verify key has required permissions: `roles/firebase.admin`

### Notifications Not Arriving
1. Check that device token is correctly registered
2. Verify platform is set correctly ('android' or 'ios')
3. Ensure app has notification permissions enabled
4. Check Firebase Console for error messages

### Invalid Token Errors
- Tokens expire over time, especially on Android
- The system automatically marks invalid tokens as inactive
- Mobile app should refresh token periodically and re-register

### Secret Manager Issues (Cloud Build)
- Ensure KMS key exists and is accessible
- Grant Cloud Build service account permissions to access secrets
- Use correct secret name in `--set-env-vars`

## TODO/Future Enhancements

1. **Admin Authorization Check**:
   - Currently sends notifications are not restricted to admins
   - TODO: Add role-based access control in `/api/notifications/send`

2. **Broadcast Optimization**:
   - Current implementation sends to all tokens sequentially
   - TODO: Implement batching (FCM allows up to 500 tokens per request)

3. **Notification History**:
   - Add table to track all sent notifications
   - Enable admin to view delivery status

4. **User Preferences**:
   - Add notification preferences table
   - Allow users to opt-out of certain notification types

5. **Deep Linking**:
   - Add navigation data in notification payload
   - Direct users to specific exams/questions when tapping notification

6. **Scheduled Notifications**:
   - Allow scheduling notifications for future delivery
   - Useful for reminders and announcements

## Security Considerations

1. **Service Account Key**: Keep `FCM_SERVICE_KEY` secure
   - Never commit to version control
   - Use environment variables or Secret Manager
   - Rotate keys regularly

2. **Token Validation**: Tokens are validated before sending
   - Invalid tokens are automatically marked inactive
   - Prevents sending to invalid/expired tokens

3. **Authentication**: All endpoints require user authentication
   - Device registration requires login
   - Notification sending restricted to authenticated users

4. **Authorization**: TODO
   - Implement admin-only check for notification sending
   - Prevent unauthorized users from sending notifications

## References

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Cloud Build with Secrets](https://cloud.google.com/build/docs/securing-builds/use-secrets)
