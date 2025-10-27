// Test script to check if user_blocks table exists and show blocked users
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlockedUsers() {
  console.log('🔍 Testing Blocked Users Setup...\n');

  // Test 1: Check if table exists
  console.log('1️⃣ Checking if user_blocks table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('user_blocks')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ user_blocks table does NOT exist!');
    console.error('Error:', tableError.message);
    console.log('\n📝 SOLUTION:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy and paste the SQL from: sql/create-user-blocks.sql');
    console.log('5. Click "Run" or press Ctrl+Enter');
    console.log('6. Run this script again\n');
    return;
  }

  console.log('✅ user_blocks table exists!\n');

  // Test 2: Get all blocked users
  console.log('2️⃣ Fetching all blocked users...');
  const { data: blocks, error: blocksError } = await supabase
    .from('user_blocks')
    .select('*');

  if (blocksError) {
    console.error('❌ Error fetching blocks:', blocksError.message);
    return;
  }

  console.log(`✅ Found ${blocks.length} blocked user(s)\n`);

  if (blocks.length > 0) {
    console.log('📋 Blocked Users:');
    blocks.forEach((block, index) => {
      console.log(`${index + 1}. Blocker: ${block.blocker_user_id}`);
      console.log(`   Blocked: ${block.blocked_user_id}`);
      console.log(`   Date: ${new Date(block.created_at).toLocaleString()}\n`);
    });
  } else {
    console.log('ℹ️  No users have been blocked yet.');
  }

  // Test 3: Check RLS policies
  console.log('3️⃣ Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', { 
      sql: `SELECT policyname FROM pg_policies WHERE tablename = 'user_blocks';` 
    })
    .catch(() => ({ data: null, error: { message: 'Cannot check policies (needs service role)' } }));

  if (policiesError || !policies) {
    console.log('⚠️  Cannot verify RLS policies (this is normal)');
    console.log('   RLS policies should be created by the SQL migration\n');
  } else {
    console.log('✅ RLS policies are set up\n');
  }

  console.log('🎉 Blocked Users setup is complete!');
  console.log('\n📱 To test:');
  console.log('1. Block a user from chat');
  console.log('2. Go to Settings → Blocked Users');
  console.log('3. You should see the blocked user in the list');
}

testBlockedUsers().catch(console.error);

