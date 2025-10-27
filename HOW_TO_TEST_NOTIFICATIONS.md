# 🧪 How to Test Notification Settings

## ✅ **3 Ways to Verify It's Working**

---

## **Method 1: Visual Testing in App** 👀

### **Step 1: Open Settings**
1. Open your app
2. Go to **Settings** tab
3. Scroll to **Notifications** section

### **Step 2: Toggle Switches**
1. Turn **Push Notifications** OFF
   - ✅ Sub-toggles should disappear
2. Turn **Push Notifications** ON
   - ✅ Sub-toggles should reappear
3. Toggle each sub-switch (Matches, Messages, Likes)
   - ✅ Each should toggle independently

### **Step 3: Check Console Logs**
Open browser console (F12) and look for:
```
[Settings] Toggling push notifications: true
[NotificationPrefs] Updating preferences: {push_enabled: true}
[NotificationPrefs] ✅ Preferences updated successfully
[Settings] ✅ Push notifications updated successfully
```

### **Step 4: Refresh App**
1. Refresh the page (Ctrl+R or F5)
2. Go back to Settings
3. ✅ Your toggle states should persist!

---

## **Method 2: Check Database** 🗄️

### **In Supabase Dashboard:**
1. Go to **Table Editor**
2. Find **notification_preferences** table
3. Click to view data
4. You should see:
   - Your user_id
   - push_enabled (true/false)
   - match_notifications (true/false)
   - message_notifications (true/false)
   - like_notifications (true/false)
   - Timestamps

### **Toggle a Switch:**
1. In your app, toggle any switch
2. Go back to Supabase
3. Refresh the table
4. ✅ The value should change!

---

## **Method 3: Run Test Script** 🧪

### **Step 1: Run the Script**
```bash
node test-notification-settings.js
```

### **Step 2: Check Output**
You should see something like:
```
🔔 Testing Notification Settings...

📊 Fetching all notification preferences...
✅ Found 1 user(s) with notification preferences

👤 User 1:
   User ID: 79753d42-f93d-460f-b69f-7fb3caca1683
   Push Notifications: ✅ ON
   Match Notifications: ✅ ON
   Message Notifications: ✅ ON
   Like Notifications: ✅ ON
   Created: 10/24/2025, 10:30:00 AM
   Updated: 10/24/2025, 10:35:00 AM

📧 Getting user emails...

👥 Users with their notification settings:

📧 123@test.com
   Push: ✅ | Matches: ✅ | Messages: ✅ | Likes: ✅

✅ Notification settings are working correctly!
```

### **Step 3: Test Changes**
1. Toggle a switch in your app
2. Run the script again
3. ✅ You should see the updated value!

---

## **What Each Toggle Does** 🔔

### **Push Notifications (Master Switch)**
- **ON**: Enables all notifications, shows sub-toggles
- **OFF**: Disables all notifications, hides sub-toggles

### **Match Notifications**
- **ON**: Get notified when you match with someone
- **OFF**: No match notifications

### **Message Notifications**
- **ON**: Get notified for new messages
- **OFF**: No message notifications

### **Like Notifications**
- **ON**: Get notified when someone likes you
- **OFF**: No like notifications

---

## **Expected Behavior** ✅

### **When Push is OFF:**
```
Notifications
  Push Notifications    [  OFF]
(No sub-toggles visible)
```

### **When Push is ON:**
```
Notifications
  Push Notifications    [✓ ON]
  New Matches           [✓ ON]
  New Messages          [✓ ON]
  New Likes             [✓ ON]
```

---

## **Console Logs to Look For** 📝

### **On Page Load:**
```
[NotificationPrefs] Fetching preferences for user: xxx
[NotificationPrefs] Preferences loaded: {push_enabled: true, ...}
```

### **On Toggle:**
```
[Settings] Toggling push notifications: false
[NotificationPrefs] Updating preferences: {push_enabled: false}
[NotificationPrefs] ✅ Preferences updated successfully
[Settings] ✅ Push notifications updated successfully
```

### **On Error:**
```
[NotificationPrefs] Error updating preferences: ...
Failed to update notification settings: ...
```

---

## **Troubleshooting** 🔧

### **Problem: Toggles don't save**
- Check console for errors
- Verify SQL migration ran successfully
- Check Supabase Table Editor for the table

### **Problem: "Table not found" error**
- Run the SQL migration: `RUN_THIS_SQL_IN_SUPABASE.sql`
- Refresh your app

### **Problem: Toggles reset on refresh**
- Check browser console for errors
- Verify RLS policies are set up
- Make sure you're logged in

### **Problem: Can't see sub-toggles**
- Make sure Push Notifications is ON
- Check console for loading errors

---

## **Quick Test Checklist** ✅

- [ ] Open Settings tab
- [ ] See Notifications section
- [ ] Toggle Push Notifications OFF → sub-toggles hide
- [ ] Toggle Push Notifications ON → sub-toggles appear
- [ ] Toggle each sub-switch
- [ ] Check console for success messages
- [ ] Refresh page
- [ ] Settings persist ✅
- [ ] Run test script
- [ ] See your settings in output ✅

---

## **It's Working If:** 🎉

1. ✅ Toggles respond to clicks
2. ✅ Sub-toggles show/hide based on master switch
3. ✅ Console shows success messages
4. ✅ Settings persist after refresh
5. ✅ Database shows updated values
6. ✅ Test script shows your settings

---

**If all checks pass, your notification settings are fully functional!** 🚀

