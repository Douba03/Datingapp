require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkWarnings() {
  console.log('\n🔍 Checking 123@test.com...\n');

  // Get user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, status')
    .eq('email', '123@test.com')
    .single();

  if (userError) {
    console.error('❌ User not found:', userError.message);
    console.log('\n💡 User needs to complete signup in the mobile app!\n');
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Status: ${user.status}\n`);

  // Get warnings
  const { data: warnings, error: warningsError } = await supabase
    .from('user_warnings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (warningsError) {
    console.error('❌ Error fetching warnings:', warningsError.message);
    return;
  }

  console.log(`📊 Total warnings: ${warnings.length}\n`);

  if (warnings.length === 0) {
    console.log('⚠️  No warnings found!');
    console.log('   → Admin needs to send a warning from the dashboard\n');
  } else {
    warnings.forEach((w, i) => {
      console.log(`Warning #${i + 1}:`);
      console.log(`   ID: ${w.id}`);
      console.log(`   Reason: ${w.reason}`);
      console.log(`   Message: ${w.message || 'No message'}`);
      console.log(`   Acknowledged: ${w.acknowledged ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Created: ${w.created_at}`);
      console.log('');
    });

    const unacknowledged = warnings.filter(w => !w.acknowledged);
    console.log(`\n✅ ${unacknowledged.length} unacknowledged warning(s) - should show in app!`);
  }
}

checkWarnings();

