# 🧪 **Push Notifications Testing Guide**

## **📋 Testing Checklist**

### **Phase 1: Database Setup** ✅
- [ ] Run `sql/create-push-notifications.sql` in Supabase
- [ ] Verify tables created: `user_push_tokens`, `notification_logs`
- [ ] Check RLS policies are active

### **Phase 2: Edge Functions Deployment** 
- [ ] Deploy Edge Functions to Supabase
- [ ] Set environment variables
- [ ] Test functions individually

### **Phase 3: Frontend Integration**
- [ ] Initialize notification service in app
- [ ] Register push tokens
- [ ] Test notification handling

### **Phase 4: End-to-End Testing**
- [ ] Test match notifications
- [ ] Test message notifications  
- [ ] Test like notifications
- [ ] Test notification preferences

---

## **🚀 Step-by-Step Testing Process**

### **Step 1: Deploy Edge Functions**

```bash
# Initialize Supabase (if not done already)
npx supabase init

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
npx supabase functions deploy
```

### **Step 2: Set Environment Variables**

In Supabase Dashboard → Settings → Edge Functions:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Step 3: Test Functions Manually**

#### **Test Match Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-match-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "USER_UUID_HERE",
    "matched_user_id": "MATCHED_USER_UUID_HERE", 
    "match_id": "MATCH_UUID_HERE"
  }'
```

#### **Test Message Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-message-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipient_id": "RECIPIENT_UUID_HERE",
    "sender_id": "SENDER_UUID_HERE",
    "message_id": "MESSAGE_UUID_HERE",
    "match_id": "MATCH_UUID_HERE",
    "message_text": "Hello! This is a test message."
  }'
```

#### **Test Like Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-like-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "liked_user_id": "LIKED_USER_UUID_HERE",
    "liker_id": "LIKER_UUID_HERE",
    "swipe_id": "SWIPE_UUID_HERE"
  }'
```

---

## **📱 Frontend Testing**

### **Step 4: Initialize Notification Service**

Add this to your main app component (`src/app/_layout.tsx`):

```typescript
import { useEffect } from 'react';
import { notificationService } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { user } = useAuth();

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Register for push notifications
        const token = await notificationService.registerForPushNotifications();
        
        if (token && user?.id) {
          // Save token to database
          await savePushTokenToDatabase(user.id, token);
          console.log('Push token registered:', token);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    if (user) {
      initializeNotifications();
    }
  }, [user]);

  // ... rest of your component
}

async function savePushTokenToDatabase(userId: string, token: string) {
  const { supabase } = await import('@/services/supabase/client');
  
  const { error } = await supabase
    .from('user_push_tokens')
    .upsert({
      user_id: userId,
      expo_push_token: token,
      device_type: Platform.OS,
      is_active: true,
      last_used_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error saving push token:', error);
  }
}
```

### **Step 5: Test Notification Handling**

Add notification listeners to handle taps:

```typescript
import { useEffect } from 'react';
import { notificationService } from '@/services/notifications';
import { useRouter } from 'expo-router';

export default function App() {
  const router = useRouter();

  useEffect(() => {
    // Handle notification taps
    const subscription = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data?.screen === 'chat' && data?.chat_id) {
          router.push(`/(tabs)/chat/${data.chat_id}`);
        } else if (data?.screen === 'discover') {
          router.push('/(tabs)/');
        }
      }
    );

    return () => {
      notificationService.removeNotificationListener(subscription);
    };
  }, []);

  // ... rest of your component
}
```

---

## **🔍 Testing Scenarios**

### **Scenario 1: Test Match Notifications**

1. **Create two test users** in your app
2. **Make them swipe right on each other** (create a match)
3. **Check if both users receive notifications**
4. **Verify notification content** shows correct names
5. **Test notification tap** opens chat screen

### **Scenario 2: Test Message Notifications**

1. **Open chat between matched users**
2. **Send a message from User A to User B**
3. **Check if User B receives notification**
4. **Verify notification shows sender name and message preview**
5. **Test notification tap** opens correct chat

### **Scenario 3: Test Like Notifications**

1. **Have User A swipe right on User B**
2. **Check if User B receives "Someone Liked You" notification**
3. **Verify notification encourages checking profile**
4. **Test notification tap** opens discover screen

### **Scenario 4: Test Notification Preferences**

1. **Go to Settings → Notifications**
2. **Disable "Match Notifications"**
3. **Create a match** - should NOT receive notification
4. **Re-enable notifications**
5. **Create another match** - should receive notification

---

## **📊 Monitoring & Debugging**

### **Check Database Tables:**

```sql
-- Check push tokens
SELECT * FROM user_push_tokens WHERE is_active = true;

-- Check notification logs
SELECT * FROM notification_logs ORDER BY sent_at DESC LIMIT 10;

-- Check notification stats
SELECT * FROM notification_stats;
```

### **Check Function Logs:**

1. Go to Supabase Dashboard → Edge Functions
2. Click on any function
3. Go to "Logs" tab
4. Look for errors or successful executions

### **Check App Logs:**

```typescript
// Add this to your notification service for debugging
console.log('Push token:', token);
console.log('Notification sent:', result);
console.log('Error:', error);
```

---

## **🐛 Common Issues & Solutions**

### **Issue: No push tokens found**
**Solution:** 
- Check if user is logged in
- Verify token registration is working
- Check `user_push_tokens` table

### **Issue: Notifications not sending**
**Solution:**
- Check Edge Function logs
- Verify environment variables
- Check notification preferences

### **Issue: Notifications not showing on device**
**Solution:**
- Check device notification permissions
- Verify Expo push token is valid
- Test with Expo Go app first

### **Issue: Database triggers not working**
**Solution:**
- Run `sql/create-notification-triggers.sql`
- Check if http extension is enabled
- Verify configuration variables

---

## **✅ Success Criteria**

Your push notifications are working correctly when:

- ✅ **Users receive match notifications** when they match
- ✅ **Users receive message notifications** when they get messages
- ✅ **Users receive like notifications** when someone likes them
- ✅ **Notification preferences are respected**
- ✅ **Tapping notifications opens correct screens**
- ✅ **All notifications are logged in database**
- ✅ **No errors in function logs**

---

## **🎯 Quick Test Script**

Create this test file to quickly verify everything:

```typescript
// test-notifications.ts
import { notificationService } from './src/services/notifications';

export async function testNotifications() {
  console.log('🧪 Testing Push Notifications...');
  
  // Test 1: Register for notifications
  const token = await notificationService.registerForPushNotifications();
  console.log('✅ Push token:', token ? 'Received' : 'Failed');
  
  // Test 2: Check permissions
  const enabled = await notificationService.areNotificationsEnabled();
  console.log('✅ Permissions:', enabled ? 'Granted' : 'Denied');
  
  // Test 3: Send test notification
  if (token) {
    await notificationService.sendLocalNotification({
      type: 'system',
      title: 'Test Notification',
      body: 'Push notifications are working!',
    });
    console.log('✅ Test notification sent');
  }
  
  console.log('🎉 Testing complete!');
}
```

**Run this test to verify your setup!** 🚀
