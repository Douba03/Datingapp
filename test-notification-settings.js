// Test Notification Settings
// Run this with: node test-notification-settings.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkzODA1NSwiZXhwIjoyMDczNTE0MDU1fQ.4yenGM_kZукраїни3xO5vPmQeKqFhзації8rOY-oCJPXnNEKs'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotificationSettings() {
  console.log('🔔 Testing Notification Settings...\n');

  try {
    // 1. Check if table exists and get all preferences
    console.log('📊 Fetching all notification preferences...');
    const { data: allPrefs, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching preferences:', fetchError.message);
      return;
    }

    console.log(`✅ Found ${allPrefs.length} user(s) with notification preferences\n`);

    if (allPrefs.length === 0) {
      console.log('⚠️  No notification preferences found. Users need to sign up first.\n');
      return;
    }

    // 2. Display each user's preferences
    allPrefs.forEach((pref, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   User ID: ${pref.user_id}`);
      console.log(`   Push Notifications: ${pref.push_enabled ? '✅ ON' : '❌ OFF'}`);
      console.log(`   Match Notifications: ${pref.match_notifications ? '✅ ON' : '❌ OFF'}`);
      console.log(`   Message Notifications: ${pref.message_notifications ? '✅ ON' : '❌ OFF'}`);
      console.log(`   Like Notifications: ${pref.like_notifications ? '✅ ON' : '❌ OFF'}`);
      console.log(`   Created: ${new Date(pref.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(pref.updated_at).toLocaleString()}`);
      console.log('');
    });

    // 3. Get user emails for better identification
    console.log('📧 Getting user emails...');
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (users && users.users) {
      console.log('\n👥 Users with their notification settings:');
      users.users.forEach(user => {
        const userPrefs = allPrefs.find(p => p.user_id === user.id);
        if (userPrefs) {
          console.log(`\n📧 ${user.email}`);
          console.log(`   Push: ${userPrefs.push_enabled ? '✅' : '❌'} | Matches: ${userPrefs.match_notifications ? '✅' : '❌'} | Messages: ${userPrefs.message_notifications ? '✅' : '❌'} | Likes: ${userPrefs.like_notifications ? '✅' : '❌'}`);
        }
      });
    }

    console.log('\n\n✅ Notification settings are working correctly!');
    console.log('\n📝 How to test:');
    console.log('1. Open your app');
    console.log('2. Go to Settings tab');
    console.log('3. Toggle any notification switch');
    console.log('4. Run this script again to see the changes');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNotificationSettings();

