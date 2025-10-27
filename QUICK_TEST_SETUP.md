# 🚀 **Quick Push Notifications Setup & Test**

## **Step 1: Run Database Migration**

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the contents of `sql/create-push-notifications.sql`**
4. **Click "Run"**

## **Step 2: Deploy Edge Functions**

```bash
# In your project directory
npx supabase init
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy
```

## **Step 3: Set Environment Variables**

In Supabase Dashboard → Settings → Edge Functions, add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## **Step 4: Test in Your App**

Add this to your main app component:

```typescript
import { useEffect } from 'react';
import { notificationService } from '@/services/notifications';

export default function App() {
  useEffect(() => {
    const testNotifications = async () => {
      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      console.log('Push token:', token);
      
      // Send test notification
      await notificationService.sendLocalNotification({
        type: 'system',
        title: '🎉 Test',
        body: 'Push notifications are working!',
      });
    };
    
    testNotifications();
  }, []);

  return (
    // Your app content
  );
}
```

## **Step 5: Test Edge Functions**

Use the test script I created:

```typescript
import { testPushNotifications } from './test-notifications';
testPushNotifications();
```

## **Step 6: Test Real Scenarios**

1. **Create two test users**
2. **Make them match each other**
3. **Send messages between them**
4. **Check if notifications appear**

---

## **🔍 What to Look For:**

### **✅ Success Indicators:**
- Push token is generated
- Local notifications appear
- Database tables are accessible
- Edge Functions respond without errors
- Real notifications appear on device

### **❌ Common Issues:**
- **No push token**: Check device permissions
- **Database errors**: Run SQL migration
- **Edge Function errors**: Check deployment and env vars
- **No notifications**: Check user preferences

---

## **📱 Testing on Device:**

### **iOS Simulator:**
- Notifications work in simulator
- Check notification center

### **Android Emulator:**
- Notifications work in emulator
- Check notification panel

### **Physical Device:**
- **Best for testing** - real push notifications
- Check notification permissions
- Test with Expo Go app first

---

## **🎯 Quick Test Commands:**

```bash
# Test Edge Functions with curl
curl -X POST 'https://your-project.supabase.co/functions/v1/send-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"USER_ID","notification_type":"system","title":"Test","body":"Hello!"}'

# Check function logs
npx supabase functions logs send-notification
```

---

## **📊 Monitor Results:**

1. **Check Supabase Dashboard → Edge Functions → Logs**
2. **Check `notification_logs` table in database**
3. **Check app console for errors**
4. **Test on multiple devices**

---

## **🚨 If Something's Not Working:**

1. **Check the testing guide**: `PUSH_NOTIFICATIONS_TESTING_GUIDE.md`
2. **Run the test script**: `test-notifications.ts`
3. **Check Edge Function logs** in Supabase dashboard
4. **Verify environment variables** are set correctly
5. **Test with a physical device** (not simulator)

**Your push notification system should be working after these steps!** 🎉
