#!/usr/bin/env node

// Debug Profile Saving Issue
// Run with: node debug-profile-save.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfileSave() {
  console.log('🔍 Debugging Profile Save Issue...\n');

  try {
    // 1. Check current profiles
    console.log('1. Checking current profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, bio, interests, photos, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`✅ Found ${profiles.length} profiles:`);
    profiles.forEach(profile => {
      console.log(`   - ${profile.first_name} (${profile.user_id.slice(0, 8)}...)`);
      console.log(`     Bio: ${profile.bio || 'No bio'}`);
      console.log(`     Interests: ${profile.interests?.join(', ') || 'No interests'}`);
      console.log(`     Photos: ${profile.photos?.length || 0} photos`);
      console.log(`     Updated: ${profile.updated_at}`);
    });

    if (profiles.length === 0) {
      console.log('⚠️  No profiles found.');
      return;
    }

    const testProfile = profiles[0];
    
    // 2. Test direct update with minimal data
    console.log('\n2. Testing direct profile update...');
    console.log(`   Profile: ${testProfile.first_name}`);
    console.log(`   User ID: ${testProfile.user_id}`);
    
    const testBio = `Debug test bio - ${new Date().toLocaleString()}`;
    const testInterests = ['Debug', 'Testing', 'JavaScript'];
    
    console.log(`   New bio: ${testBio}`);
    console.log(`   New interests: ${testInterests.join(', ')}`);

    // Try update without .single() first
    const { data: updateData, error: updateError } = await supabase
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
      
      // Check if it's a permissions issue
      console.log('\n🔍 Checking RLS policies...');
      
      // Try to check what the user can actually see
      const { data: checkData, error: checkError } = await supabase
        .from('profiles')
        .select('user_id, first_name')
        .eq('user_id', testProfile.user_id);
      
      console.log('Check result:', { checkData, checkError });
      
      if (checkError) {
        console.log('❌ Cannot even read the specific profile - RLS issue');
      }
      
      return;
    }

    if (!updateData || updateData.length === 0) {
      console.log('⚠️  Update returned no data - RLS policy blocking update');
      
      // Check what we can actually update
      console.log('\n🔍 Checking what we can update...');
      
      // Try to update just the updated_at field
      const { data: timeUpdate, error: timeError } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testProfile.user_id)
        .select();
      
      console.log('Time update result:', { timeUpdate, timeError });
      
      return;
    }

    console.log('✅ Profile updated successfully!');
    console.log(`   Updated bio: ${updateData[0].bio}`);
    console.log(`   Updated interests: ${updateData[0].interests?.join(', ') || 'None'}`);
    console.log(`   Updated at: ${updateData[0].updated_at}`);

    // 3. Verify the update persisted
    console.log('\n3. Verifying update persisted...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('bio, interests, updated_at')
      .eq('user_id', testProfile.user_id)
      .single();

    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }

    console.log('✅ Verification successful!');
    console.log(`   Current bio: ${verifyData.bio}`);
    console.log(`   Current interests: ${verifyData.interests?.join(', ') || 'None'}`);
    console.log(`   Current updated_at: ${verifyData.updated_at}`);

    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'profiles' })
      .catch(() => {
        // This RPC might not exist, that's ok
        return { data: null, error: { message: 'get_policies RPC not available' } };
      });

    if (policiesError) {
      console.log('⚠️  Cannot check policies directly:', policiesError.message);
    } else {
      console.log('Policies:', policies);
    }

    console.log('\n🎯 DIAGNOSIS:');
    if (updateData && updateData.length > 0) {
      console.log('✅ Profile updates are working correctly');
      console.log('   The issue might be in the app code or authentication');
    } else {
      console.log('❌ Profile updates are blocked by RLS policies');
      console.log('   Need to fix database permissions');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugProfileSave();
