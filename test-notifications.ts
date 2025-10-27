// Test script for push notifications
// Run this in your app to test the notification system

import { notificationService } from './src/services/notifications';
import { supabase } from './src/services/supabase/client';

export async function testPushNotifications() {
  console.log('🧪 Starting Push Notification Tests...');
  
  try {
    // Test 1: Register for push notifications
    console.log('\n📱 Test 1: Registering for push notifications...');
    const token = await notificationService.registerForPushNotifications();
    
    if (token) {
      console.log('✅ Push token received:', token.substring(0, 20) + '...');
      
      // Save token to database
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
    } else {
      console.log('❌ Failed to get push token');
    }
    
    // Test 2: Check notification permissions
    console.log('\n🔐 Test 2: Checking notification permissions...');
    const enabled = await notificationService.areNotificationsEnabled();
    console.log('✅ Permissions:', enabled ? 'Granted' : 'Denied');
    
    // Test 3: Send local notification
    console.log('\n📨 Test 3: Sending test notification...');
    await notificationService.sendLocalNotification({
      type: 'system',
      title: '🎉 Test Notification',
      body: 'Push notifications are working correctly!',
    });
    console.log('✅ Test notification sent');
    
    // Test 4: Check database tables exist
    console.log('\n🗄️ Test 4: Checking database tables...');
    
    const { data: tokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('*')
      .limit(1);
    
    if (tokensError) {
      console.log('❌ user_push_tokens table error:', tokensError.message);
    } else {
      console.log('✅ user_push_tokens table accessible');
    }
    
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .limit(1);
    
    if (logsError) {
      console.log('❌ notification_logs table error:', logsError.message);
    } else {
      console.log('✅ notification_logs table accessible');
    }
    
    // Test 5: Test Edge Function (if deployed)
    console.log('\n⚡ Test 5: Testing Edge Function...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await notificationService.sendNotificationViaFunction(
          user.id,
          'system',
          '🧪 Edge Function Test',
          'This notification was sent via Edge Function!',
          { test: true }
        );
        console.log('✅ Edge Function test result:', result);
      }
    } catch (error) {
      console.log('❌ Edge Function test failed:', error.message);
      console.log('💡 Make sure Edge Functions are deployed and environment variables are set');
    }
    
    console.log('\n🎉 Push Notification Tests Complete!');
    console.log('\n📋 Summary:');
    console.log('- Push token registration:', token ? '✅ Working' : '❌ Failed');
    console.log('- Notification permissions:', enabled ? '✅ Granted' : '❌ Denied');
    console.log('- Local notifications:', '✅ Working');
    console.log('- Database tables:', tokensError || logsError ? '❌ Issues' : '✅ Working');
    console.log('- Edge Functions:', 'Check logs above');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Helper function to test specific notification types
export async function testMatchNotification(userId: string, matchedUserId: string, matchId: string) {
  console.log('💕 Testing match notification...');
  try {
    const result = await notificationService.sendMatchNotification(userId, matchedUserId, matchId);
    console.log('✅ Match notification sent:', result);
  } catch (error) {
    console.log('❌ Match notification failed:', error.message);
  }
}

export async function testMessageNotification(recipientId: string, senderId: string, messageId: string, matchId: string, messageText: string) {
  console.log('💬 Testing message notification...');
  try {
    const result = await notificationService.sendMessageNotification(recipientId, senderId, messageId, matchId, messageText);
    console.log('✅ Message notification sent:', result);
  } catch (error) {
    console.log('❌ Message notification failed:', error.message);
  }
}

export async function testLikeNotification(likedUserId: string, likerId: string, swipeId: string) {
  console.log('❤️ Testing like notification...');
  try {
    const result = await notificationService.sendLikeNotification(likedUserId, likerId, swipeId);
    console.log('✅ Like notification sent:', result);
  } catch (error) {
    console.log('❌ Like notification failed:', error.message);
  }
}

// Usage example:
// import { testPushNotifications } from './test-notifications';
// testPushNotifications();
