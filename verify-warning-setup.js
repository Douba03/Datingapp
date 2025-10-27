require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: 'admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Try to use service role key first (for admin queries), fallback to anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE ROLE (admin)' : 'ANON (limited)');

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('\n🔍 Verifying Warning System Setup...\n');
  
  // Check user_warnings table exists
  console.log('1. Checking if user_warnings table exists...');
  const { data, error } = await supabase
    .from('user_warnings')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('   ❌ user_warnings table MISSING or inaccessible!');
    console.log('   Error:', error.message);
    console.log('   📝 Action: Run sql/create-user-warnings.sql in Supabase');
    return;
  }
  
  console.log('   ✅ user_warnings table exists\n');
  
  // Get all auth users
  console.log('2. Checking users...');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log(`   Found ${authUsers?.users?.length || 0} registered users\n`);
  
  // Check for all warnings
  console.log('3. Checking warnings...');
  const { data: allWarnings } = await supabase
    .from('user_warnings')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log(`   Total warnings in database: ${allWarnings?.length || 0}`);
  
  // Check for unacknowledged warnings
  const unacknowledged = allWarnings?.filter(w => !w.acknowledged) || [];
  console.log(`   Unacknowledged warnings: ${unacknowledged.length}\n`);
  
  if (unacknowledged.length > 0) {
    console.log('✅ READY TO TEST! Found unacknowledged warnings:\n');
    
    // Get user info for each warning
    for (const warning of unacknowledged) {
      // Find user email from auth users
      const user = authUsers?.users.find(u => u.id === warning.user_id);
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 User Email: ${user?.email || 'Unknown'}`);
      console.log(`🆔 User ID: ${warning.user_id}`);
      console.log(`⚠️  Reason: ${warning.reason}`);
      console.log(`💬 Message: ${warning.message || 'No message'}`);
      console.log(`📅 Created: ${new Date(warning.created_at).toLocaleString()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    console.log('🎯 TO TEST:');
    console.log('1. Open http://localhost:8082 in FRESH browser tab');
    console.log('2. Press F12 to open console');
    console.log(`3. Login as one of the users above (e.g., ${unacknowledged[0] ? authUsers?.users.find(u => u.id === unacknowledged[0].user_id)?.email : 'N/A'})`);
    console.log('4. Watch console for:');
    console.log('   [SimpleWarningAlert] User logged in, waiting 2 seconds...');
    console.log('   [SimpleWarningAlert] ✅ Query successful, found X warnings');
    console.log('5. After 2 seconds → Alert appears! ✅\n');
  } else {
    console.log('⚠️  NO UNACKNOWLEDGED WARNINGS FOUND\n');
    console.log('📝 TO FIX:');
    console.log('1. Open admin dashboard: http://localhost:3001/dashboard/users');
    console.log('2. Find a user (e.g., 123@test.com)');
    console.log('3. Click "Warn" button');
    console.log('4. Send a warning');
    console.log('5. Then test in mobile app\n');
  }
  
  // Show all warnings for debugging
  if (allWarnings && allWarnings.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ALL WARNINGS (including acknowledged):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    allWarnings.forEach((w, i) => {
      const user = authUsers?.users.find(u => u.id === w.user_id);
      console.log(`${i + 1}. ${user?.email || 'Unknown'} (${w.acknowledged ? '✅ Acknowledged' : '❌ Not acknowledged'})`);
      console.log(`   Reason: ${w.reason}`);
      console.log(`   Message: ${w.message || 'No message'}`);
      console.log('');
    });
  }
}

verify().catch(err => {
  console.error('❌ Error:', err);
});

