#!/usr/bin/env node

// Test Profile Update with Proper Authentication
// This simulates what the app should do when properly authenticated

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';

// Use the anon key (same as the app)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthenticatedUpdate() {
  console.log('🔐 Testing Profile Update with Authentication...\n');

  try {
    // 1. First, let's see if we can get the current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (session) {
      console.log('✅ Found active session:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });
    } else {
      console.log('⚠️  No active session found');
      console.log('   This means the app needs to be properly authenticated');
    }

    // 2. Get profiles (this should work with anon key)
    console.log('\n2. Getting profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, bio, interests')
      .limit(1);

    if (profilesError) {
      console.error('❌ Cannot read profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found');
      return;
    }

    const testProfile = profiles[0];
    console.log(`✅ Found profile: ${testProfile.first_name} (${testProfile.user_id.slice(0, 8)}...)`);

    // 3. Try to update the profile
    console.log('\n3. Testing profile update...');
    
    const testBio = `Authenticated test - ${new Date().toLocaleString()}`;
    const testInterests = ['Auth', 'Test', 'JavaScript'];
    
    console.log(`   Updating bio to: ${testBio}`);
    console.log(`   Updating interests to: ${testInterests.join(', ')}`);

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        bio: testBio,
        interests: testInterests,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testProfile.user_id)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      
      if (updateError.code === 'PGRST301') {
        console.log('🔍 This is an RLS policy error');
        console.log('   The anon key cannot update profiles');
        console.log('   The app needs to be properly authenticated');
      }
      
      return;
    }

    if (!updateResult || updateResult.length === 0) {
      console.log('⚠️  Update returned no data');
      console.log('   This confirms RLS is blocking the update');
      console.log('   The app needs proper authentication');
      return;
    }

    console.log('✅ Profile updated successfully!');
    console.log(`   New bio: ${updateResult[0].bio}`);
    console.log(`   New interests: ${updateResult[0].interests.join(', ')}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAuthenticatedUpdate();
