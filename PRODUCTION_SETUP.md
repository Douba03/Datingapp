# Production Setup Guide for Mali Match IAP

## Overview
This guide covers setting up In-App Purchases for production on iOS and Android.

---

## 1. Supabase Edge Functions Setup

### Deploy Edge Functions
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref zfnwtnqwokwvuxxwxgsr

# Deploy the functions
supabase functions deploy validate-receipt
supabase functions deploy subscription-webhook
```

### Set Environment Variables in Supabase Dashboard
Go to: Project Settings → Edge Functions → Secrets

Add these secrets:
- `APPLE_SHARED_SECRET` - Get from App Store Connect → My Apps → Your App → App Information → App-Specific Shared Secret
- `GOOGLE_SERVICE_ACCOUNT_KEY` - JSON key from Google Cloud Console service account
- `ANDROID_PACKAGE_NAME` - Your Android package name (e.g., `com.qossai.malimatch`)

---

## 2. Database Migration

Run this SQL in Supabase SQL Editor:

```sql
-- See: supabase/migrations/20241213_purchase_tables.sql
```

---

## 3. Apple App Store Setup

### App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create your app if not exists
3. Go to **Subscriptions** → Create subscription group "Premium"
4. Add subscription product with ID: `premium`
5. Set pricing to $1.99/month

### Server Notifications (Webhooks)
1. Go to App Store Connect → Your App → App Information
2. Under "App Store Server Notifications", set URL to:
   ```
   https://zfnwtnqwokwvuxxwxgsr.supabase.co/functions/v1/subscription-webhook?platform=apple
   ```
3. Select "Version 2 Notifications"

### Get Shared Secret
1. App Store Connect → Your App → App Information
2. Click "Manage" under App-Specific Shared Secret
3. Generate and copy the secret
4. Add to Supabase secrets as `APPLE_SHARED_SECRET`

---

## 4. Google Play Setup

### Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create your app if not exists
3. Go to **Monetize** → **Subscriptions**
4. Create subscription with ID: `premium`
5. Set pricing to $1.99/month

### Real-time Developer Notifications
1. Go to Google Play Console → Your App → Monetization setup
2. Under "Real-time developer notifications", set topic name
3. Create a Pub/Sub subscription that pushes to:
   ```
   https://zfnwtnqwokwvuxxwxgsr.supabase.co/functions/v1/subscription-webhook?platform=google
   ```

### Service Account for Validation
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a service account with "Android Publisher" role
3. Download JSON key
4. Add entire JSON content to Supabase secrets as `GOOGLE_SERVICE_ACCOUNT_KEY`

---

## 5. App Configuration

### Bundle Identifier (iOS)
In `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.qossai.malimatch"
    }
  }
}
```

### Package Name (Android)
In `app.json`:
```json
{
  "expo": {
    "android": {
      "package": "com.qossai.malimatch"
    }
  }
}
```

---

## 6. Build for Production

### iOS
```bash
# Clean and rebuild
rm -rf ios
npx expo prebuild --platform ios --clean

# Build for App Store
eas build --platform ios --profile production
```

### Android
```bash
# Clean and rebuild
rm -rf android
npx expo prebuild --platform android --clean

# Build for Play Store
eas build --platform android --profile production
```

---

## 7. Testing

### iOS Sandbox Testing
1. Create a Sandbox tester in App Store Connect
2. Sign out of App Store on device
3. When prompted during purchase, use sandbox account

### Android Testing
1. Add test accounts in Google Play Console
2. Use those accounts on test devices

---

## 8. Checklist Before Launch

- [ ] Product ID `premium` created in App Store Connect
- [ ] Product ID `premium` created in Google Play Console
- [ ] Edge functions deployed to Supabase
- [ ] `APPLE_SHARED_SECRET` set in Supabase
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` set in Supabase
- [ ] Webhook URLs configured in both stores
- [ ] Database migration applied
- [ ] Tested on real device with sandbox account
- [ ] DEV buttons hidden (automatic - they only show in `__DEV__` mode)

---

## Troubleshooting

### "Must query item from store" error
- Product not configured in store, or app not submitted for review yet
- On iOS simulator, use StoreKit Configuration file

### Purchase succeeds but premium not activated
- Check Supabase Edge Function logs
- Verify webhook URL is correct
- Check `APPLE_SHARED_SECRET` is set correctly

### Subscription not renewing
- Webhook not configured properly
- Check `webhook_events` table for incoming events
