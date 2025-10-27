# 🧪 **Manual Push Notifications Testing Guide**

Since we can't deploy Edge Functions automatically, here's how to test your push notifications manually:

## **📋 Step 1: Run Database Migration**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `sql/create-push-notifications.sql`**
4. **Click "Run"**

## **📋 Step 2: Test Database Tables**

Run this SQL to verify tables were created:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_push_tokens', 'notification_logs');

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_push_tokens', 'cleanup_old_push_tokens');
```

## **📋 Step 3: Test Push Token Registration**

Add this to your main app component to test push token registration:

```typescript
// In your main app component (src/app/_layout.tsx or App.tsx)
import { useEffect } from 'react';
import { notificationService } from '@/services/notifications';
import { supabase } from '@/services/supabase/client';
import { Platform } from 'react-native';

export default function App() {
  useEffect(() => {
    const testPushNotifications = async () => {
      try {
        console.log('🧪 Testing Push Notifications...');
        
        // Test 1: Register for push notifications
        const token = await notificationService.registerForPushNotifications();
        console.log('✅ Push token:', token);
        
        if (token) {
          // Test 2: Save token to database
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase
              .from('user_push_tokens')
              .upsert({
                user_id: user.id,
                expo_push_token: token,
                device_type: Platform.OS,
                is_active: true,
                last_used_at: new Date().toISOString()
              });
            
            if (error) {
              console.log('❌ Error saving token:', error.message);
            } else {
              console.log('✅ Token saved to database');
            }
          }
        }
        
        // Test 3: Send local notification
        await notificationService.sendLocalNotification({
          type: 'system',
          title: '🎉 Test Notification',
          body: 'Push notifications are working!',
        });
        console.log('✅ Test notification sent');
        
        // Test 4: Check notification permissions
        const enabled = await notificationService.areNotificationsEnabled();
        console.log('✅ Permissions:', enabled ? 'Granted' : 'Denied');
        
      } catch (error) {
        console.error('❌ Test failed:', error);
      }
    };
    
    testPushNotifications();
  }, []);

  return (
    // Your app content
  );
}
```

## **📋 Step 4: Test Edge Functions Manually**

### **Option A: Deploy via Supabase Dashboard**

1. **Go to Supabase Dashboard → Edge Functions**
2. **Create new function: `send-notification`**
3. **Copy the contents of `supabase/functions/send-notification/index.ts`**
4. **Deploy the function**
5. **Repeat for other functions**

### **Option B: Test Functions with curl**

Once deployed, test with curl commands:

```bash
# Test general notification
curl -X POST 'https://your-project.supabase.co/functions/v1/send-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "USER_UUID_HERE",
    "notification_type": "system",
    "title": "Test Notification",
    "body": "This is a test notification!"
  }'
```

## **📋 Step 5: Test Real Scenarios**

### **Test Match Notifications:**

1. **Create two test users in your app**
2. **Make them swipe right on each other**
3. **Check if notifications appear**
4. **Check the `notification_logs` table in Supabase**

### **Test Message Notifications:**

1. **Open chat between matched users**
2. **Send a message**
3. **Check if recipient gets notification**
4. **Verify notification content**

## **📋 Step 6: Check Results**

### **Database Queries:**

```sql
-- Check push tokens
SELECT * FROM user_push_tokens WHERE is_active = true;

-- Check notification logs
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 10;

-- Check notification stats
SELECT * FROM notification_stats;
```

### **App Console:**

Look for these logs in your app:
- ✅ Push token received
- ✅ Token saved to database
- ✅ Test notification sent
- ✅ Permissions granted

## **📋 Step 7: Troubleshooting**

### **Common Issues:**

1. **No push token:**
   - Check device permissions
   - Test on physical device (not simulator)
   - Check Expo configuration

2. **Database errors:**
   - Run the SQL migration again
   - Check RLS policies
   - Verify user is logged in

3. **No notifications:**
   - Check notification preferences
   - Verify Edge Functions are deployed
   - Check function logs in Supabase

## **🎯 Success Criteria:**

Your push notifications are working when:

- ✅ **Push token is generated and saved**
- ✅ **Local notifications appear**
- ✅ **Database tables are accessible**
- ✅ **Real notifications appear on device**
- ✅ **Notification logs are created**

## **📱 Testing on Different Platforms:**

### **iOS Simulator:**
- Local notifications work
- Push notifications don't work (use physical device)

### **Android Emulator:**
- Local notifications work
- Push notifications don't work (use physical device)

### **Physical Device:**
- **Best for testing** - both local and push notifications work
- Use Expo Go app for testing

## **🚀 Next Steps:**

1. **Run the database migration**
2. **Test push token registration**
3. **Deploy Edge Functions manually**
4. **Test with real users**
5. **Monitor notification delivery**

**This manual approach will help you test everything step by step!** 🎉
