# FCM Implementation - Quick Reference & Checklist

## Files Modified
- [x] `shared/schema.ts` - Added deviceTokens table and types
- [x] `server/storage.ts` - Added device token management methods
- [x] `server/fcm.ts` - NEW: Firebase Cloud Messaging service
- [x] `server/routes.ts` - Added device & notification endpoints
- [x] `package.json` - Added firebase-admin dependency
- [x] `cloudbuild.yaml` - Added FCM_SERVICE_KEY secret configuration

## Database
- [ ] Run `npm run db:push` to create deviceTokens table

## Environment Setup (Choose One)

### Local Development
```bash
# Create .env file or export environment variable
export FCM_SERVICE_KEY='{"type":"service_account","project_id":"...","private_key":"...","...":"..."}'

# Or in .env file
FCM_SERVICE_KEY={"type":"service_account",...}
```

### Cloud Run
```bash
# Create secret in Secret Manager
gcloud secrets create FCM_SERVICE_KEY --data-file=service-account-key.json

# Cloud Build will inject it automatically
```

## API Endpoints

### Device Management
```
POST /api/devices/register
  { deviceToken: string, platform: 'android'|'ios' }

POST /api/devices/unregister
  { deviceToken: string }
```

### Send Notifications
```
POST /api/notifications/send
  { title: string, body: string, userId?: string, data?: object }
```

### Automatic Triggers
- **Excel Upload**: Sends "New Questions Available" notification to all users
- **Future**: Can be added to other uploads (JSON, Object)

## Mobile App Setup

### Android
1. Add Firebase SDK to build.gradle
2. Get FCM token from `FirebaseMessaging.getInstance().token`
3. POST to `/api/devices/register`
4. Firebase handles notification display automatically

### iOS
1. Add Firebase SDK via CocoaPods/SPM
2. Request user notification permission
3. Get token from `Messaging.messaging().token`
4. POST to `/api/devices/register`
5. Firebase handles notification display automatically

## Testing Flow

1. **Setup**:
   ```bash
   npm install
   npm run db:push
   ```

2. **Start Server**:
   ```bash
   npm run dev
   ```

3. **Register Device**:
   ```bash
   curl -X POST http://localhost:3000/api/devices/register \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"deviceToken":"test_token_123","platform":"android"}'
   ```

4. **Send Test Notification**:
   ```bash
   curl -X POST http://localhost:3000/api/notifications/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "title":"Test",
       "body":"Hello World",
       "userId":"user_id_here"
     }'
   ```

5. **Test Excel Upload** (with device registered):
   - Upload Excel file with questions
   - All registered devices receive: "New Questions Available: X questions added to [subject]"

## Configuration Files Generated

### cloudbuild.yaml Updates
- Passes FCM_SERVICE_KEY from Secret Manager to Cloud Run
- Syntax: `--set-env-vars` with `FCM_SERVICE_KEY=$$FCM_SERVICE_KEY`
- Secret stored in Google Cloud Secret Manager

### Environment Variables Required
- `FCM_SERVICE_KEY`: Firebase service account JSON (entire file content)
- `DATABASE_URL`: Already configured (no change needed)

## Known Limitations & TODOs

1. **Admin Check**: Not implemented in `/api/notifications/send`
   - TODO: Add authorization check before allowing notification sends

2. **Batch Notifications**: Not implemented yet
   - Current: Sends individually to each device
   - TODO: Use FCM batch API (500 tokens per request)

3. **Notification History**: Not tracked
   - TODO: Create `notification_logs` table

4. **User Preferences**: Not available
   - TODO: Create `notification_preferences` table

5. **Deep Linking**: Not implemented
   - TODO: Add navigation data to notification payload

## Troubleshooting

### "Firebase not initialized"
- Check FCM_SERVICE_KEY is set correctly
- Verify JSON is valid and complete
- Ensure key has Firebase Admin permissions

### Notifications not arriving
1. Check device token in database: `SELECT * FROM device_tokens WHERE is_active = true`
2. Verify platform is correct ('android' or 'ios')
3. Check app has notification permissions
4. Look for errors in server logs
5. Verify Firebase project settings in Console

### Invalid token errors
- Tokens expire; app should refresh periodically
- System automatically marks invalid tokens as inactive
- Check `is_active = false` tokens in database

### Cloud Build failures
- Verify FCM_SERVICE_KEY secret exists: `gcloud secrets list`
- Check Cloud Build service account has Secret Accessor role
- Review Cloud Build logs for specific errors

## Quick Deploy Checklist

- [ ] Firebase service account key downloaded
- [ ] Dependencies installed: `npm install`
- [ ] Database migrations run: `npm run db:push`
- [ ] FCM_SERVICE_KEY configured locally (for testing)
- [ ] API endpoints tested with curl or Postman
- [ ] Cloud Build trigger configured
- [ ] FCM_SERVICE_KEY added to Secret Manager (for production)
- [ ] Cloud Run deployment successful
- [ ] Mobile app integrated and tokens registering
- [ ] Test push notification received on device

## Support & Documentation

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Implementation Guide](FCM_IMPLEMENTATION_GUIDE.md)
