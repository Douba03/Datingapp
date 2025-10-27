// Debug script to test blocking a user
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBlockUser() {
  console.log('🔍 Debug: Testing Block User Functionality\n');

  // Step 1: Get a test user (the one who will block)
  console.log('1️⃣ Getting test user...');
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Not authenticated. Please sign in first.');
    console.log('   Run the app and sign in, then run this script again.');
    return;
  }

  console.log(`✅ Authenticated as: ${user.email} (${user.id})\n`);

  // Step 2: Get all users to find someone to block
  console.log('2️⃣ Getting all users...');
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('user_id, first_name')
    .neq('user_id', user.id)
    .limit(5);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No other users found to block');
    return;
  }

  console.log(`✅ Found ${users.length} users:\n`);
  users.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.first_name} (${u.user_id})`);
  });
  console.log('');

  // Step 3: Try to block the first user
  const userToBlock = users[0];
  console.log(`3️⃣ Attempting to block: ${userToBlock.first_name}...`);

  const { data: blockData, error: blockError } = await supabase
    .from('user_blocks')
    .insert({
      blocker_user_id: user.id,
      blocked_user_id: userToBlock.user_id,
    })
    .select();

  if (blockError) {
    console.error('❌ Error blocking user:', blockError);
    console.error('   Code:', blockError.code);
    console.error('   Message:', blockError.message);
    console.error('   Details:', blockError.details);
    console.error('   Hint:', blockError.hint);
    return;
  }

  console.log('✅ User blocked successfully!');
  console.log('   Block ID:', blockData[0]?.id);
  console.log('');

  // Step 4: Verify the block was saved
  console.log('4️⃣ Verifying block was saved...');
  const { data: blocks, error: verifyError } = await supabase
    .from('user_blocks')
    .select('*')
    .eq('blocker_user_id', user.id);

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError.message);
    return;
  }

  console.log(`✅ Found ${blocks.length} blocked user(s):\n`);
  blocks.forEach((block, i) => {
    console.log(`   ${i + 1}. Blocked: ${block.blocked_user_id}`);
    console.log(`      Date: ${new Date(block.created_at).toLocaleString()}\n`);
  });

  console.log('🎉 Block functionality is working!');
  console.log('\n📱 Now test in the app:');
  console.log('1. Go to Settings → Blocked Users');
  console.log('2. You should see the blocked user');
  console.log('3. Try blocking another user from chat');
}

debugBlockUser().catch(console.error);

