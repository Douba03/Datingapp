#!/usr/bin/env node

// Simple Profile Update Test
// Run with: node test-simple-update.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleUpdate() {
  console.log('🧪 Simple Profile Update Test...\n');

  try {
    // 1. First, let's check if we can read profiles
    console.log('1. Testing profile read access...');
    const { data: profiles, error: readError } = await supabase
      .from('profiles')
      .select('user_id, first_name, bio, interests')
      .limit(1);

    if (readError) {
      console.error('❌ Cannot read profiles:', readError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found to test with');
      return;
    }

    const testProfile = profiles[0];
    console.log(`✅ Can read profile: ${testProfile.first_name} (${testProfile.user_id.slice(0, 8)}...)`);

    // 2. Test a simple update without .single()
    console.log('\n2. Testing simple profile update...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        bio: `Test update at ${new Date().toLocaleString()}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testProfile.user_id)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      
      // Let's check if it's a permissions issue
      console.log('\n🔍 Checking permissions...');
      const { data: checkData, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', testProfile.user_id);
      
      console.log('Check result:', { checkData, checkError });
      return;
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('⚠️  Update succeeded but returned no data');
      console.log('This might be a Row Level Security (RLS) issue');
      return;
    }

    console.log('✅ Profile updated successfully!');
    console.log(`   Updated bio: ${updateResult[0].bio}`);

    // 3. Test the swipe function
    console.log('\n3. Testing swipe function...');
    
    // Get another profile to swipe on
    const { data: otherProfiles, error: otherError } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .neq('user_id', testProfile.user_id)
      .limit(1);

    if (otherError || !otherProfiles || otherProfiles.length === 0) {
      console.log('⚠️  No other profiles found for swipe test');
      return;
    }

    const targetProfile = otherProfiles[0];
    console.log(`   Testing swipe from ${testProfile.first_name} to ${targetProfile.first_name}`);

    const { data: swipeResult, error: swipeError } = await supabase
      .rpc('record_swipe', {
        swiper_uuid: testProfile.user_id,
        target_uuid: targetProfile.user_id,
        swipe_action: 'like'
      });

    if (swipeError) {
      console.error('❌ Swipe error:', swipeError);
      return;
    }

    console.log('✅ Swipe test successful!');
    console.log(`   Remaining swipes: ${swipeResult.remaining}`);
    console.log(`   Is match: ${swipeResult.is_match}`);

    console.log('\n🎉 All tests passed!');
    console.log('\nThe database optimizations are working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSimpleUpdate();
