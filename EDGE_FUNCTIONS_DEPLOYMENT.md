# 🚀 **Supabase Edge Functions Deployment Guide**

## **Prerequisites**
- ✅ Supabase CLI installed (`npx supabase --version`)
- ✅ SQL migrations run (`create-push-notifications.sql`)
- ✅ Supabase project linked

---

## **Step 1: Link Your Supabase Project**

```bash
# Initialize Supabase in your project
npx supabase init

# Link to your existing project
npx supabase link --project-ref YOUR_PROJECT_REF
```

**To find your project ref:**
1. Go to your Supabase dashboard
2. Click on your project
3. Go to Settings → General
4. Copy the "Reference ID"

---

## **Step 2: Deploy Edge Functions**

```bash
# Deploy all functions at once
npx supabase functions deploy

# Or deploy individual functions:
npx supabase functions deploy send-notification
npx supabase functions deploy send-match-notification
npx supabase functions deploy send-message-notification
npx supabase functions deploy send-like-notification
```

---

## **Step 3: Set Environment Variables**

In your Supabase dashboard, go to **Settings → Edge Functions** and add:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**To find your service role key:**
1. Go to Settings → API
2. Copy the "service_role" key (not the anon key)

---

## **Step 4: Run Database Triggers**

Run this SQL in your Supabase SQL Editor:

```sql
-- First, enable the http extension
CREATE EXTENSION IF NOT EXISTS http;

-- Set configuration variables
ALTER SYSTEM SET app.supabase_url = 'https://your-project.supabase.co';
ALTER SYSTEM SET app.supabase_service_role_key = 'your-service-role-key';

-- Reload configuration
SELECT pg_reload_conf();
```

Then run the triggers SQL:
```sql
-- Copy and paste the contents of sql/create-notification-triggers.sql
```

---

## **Step 5: Test Your Functions**

### **Test Match Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-match-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "user-uuid-here",
    "matched_user_id": "matched-user-uuid-here", 
    "match_id": "match-uuid-here"
  }'
```

### **Test Message Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-message-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipient_id": "recipient-uuid-here",
    "sender_id": "sender-uuid-here",
    "message_id": "message-uuid-here",
    "match_id": "match-uuid-here",
    "message_text": "Hello there!"
  }'
```

### **Test Like Notification:**
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-like-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "liked_user_id": "liked-user-uuid-here",
    "liker_id": "liker-uuid-here",
    "swipe_id": "swipe-uuid-here"
  }'
```

---

## **Step 6: Verify Deployment**

1. **Check Functions Dashboard:**
   - Go to your Supabase dashboard
   - Click "Edge Functions" in the sidebar
   - You should see all 4 functions listed

2. **Check Function Logs:**
   - Click on any function
   - Go to "Logs" tab
   - You should see deployment logs

3. **Test Database Triggers:**
   - Create a new match in your app
   - Check the notification_logs table
   - You should see notification attempts logged

---

## **Troubleshooting**

### **Function Not Deploying:**
```bash
# Check if you're logged in
npx supabase status

# Re-link project if needed
npx supabase link --project-ref YOUR_PROJECT_REF
```

### **Triggers Not Working:**
- Make sure you ran the SQL migrations first
- Check that the http extension is enabled
- Verify configuration variables are set correctly

### **Notifications Not Sending:**
- Check that users have push tokens registered
- Verify notification preferences are enabled
- Check function logs for errors

---

## **Next Steps**

After deployment:
1. ✅ **Test with real users**
2. ✅ **Monitor notification delivery rates**
3. ✅ **Set up analytics dashboard**
4. ✅ **Implement notification scheduling**

---

## **Function URLs**

Once deployed, your functions will be available at:
- `https://your-project.supabase.co/functions/v1/send-notification`
- `https://your-project.supabase.co/functions/v1/send-match-notification`
- `https://your-project.supabase.co/functions/v1/send-message-notification`
- `https://your-project.supabase.co/functions/v1/send-like-notification`
