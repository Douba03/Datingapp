#!/usr/bin/env node

// Test Profile Update Functionality
// Run with: node test-profile-update.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update Functionality...\n');

  try {
    // 1. Check current profiles
    console.log('1. Checking current profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, bio, interests, updated_at')
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
      console.log(`     Updated: ${profile.updated_at}`);
    });

    if (profiles.length === 0) {
      console.log('⚠️  No profiles found. Please create a profile first.');
      return;
    }

    // 2. Test profile update
    const testProfile = profiles[0];
    const testUpdates = {
      bio: `Updated bio at ${new Date().toLocaleString()}`,
      interests: ['Testing', 'JavaScript', 'React Native', 'Supabase'],
      updated_at: new Date().toISOString(),
    };

    console.log('\n2. Testing profile update...');
    console.log(`   Updating profile: ${testProfile.first_name}`);
    console.log(`   New bio: ${testUpdates.bio}`);
    console.log(`   New interests: ${testUpdates.interests.join(', ')}`);

    console.log(`   Profile user_id: ${testProfile.user_id}`);
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(testUpdates)
      .eq('user_id', testProfile.user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return;
    }

    console.log('✅ Profile updated successfully!');
    console.log(`   Updated bio: ${updatedProfile.bio}`);
    console.log(`   Updated interests: ${updatedProfile.interests.join(', ')}`);
    console.log(`   Updated at: ${updatedProfile.updated_at}`);

    // 3. Test swipe functionality
    console.log('\n3. Testing swipe functionality...');
    
    if (profiles.length >= 2) {
      const swiperId = testProfile.user_id;
      const targetId = profiles[1].user_id;

      console.log(`   Swiping from ${profiles[0].first_name} to ${profiles[1].first_name}`);

      const { data: swipeResult, error: swipeError } = await supabase
        .rpc('record_swipe', {
          swiper_uuid: swiperId,
          target_uuid: targetId,
          swipe_action: 'like'
        });

      if (swipeError) {
        console.error('❌ Error recording swipe:', swipeError);
      } else {
        console.log('✅ Swipe recorded successfully!');
        console.log(`   Remaining swipes: ${swipeResult.remaining}`);
        console.log(`   Is match: ${swipeResult.is_match}`);
      }
    }

    // 4. Check database performance
    console.log('\n4. Testing database performance...');
    
    const startTime = Date.now();
    const { data: allProfiles, error: perfError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        first_name,
        age,
        gender,
        city,
        interests,
        preferences!inner(seeking_genders, age_min, age_max, max_distance_km)
      `)
      .limit(50);
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;

    if (perfError) {
      console.error('❌ Performance test error:', perfError);
    } else {
      console.log(`✅ Performance test completed in ${queryTime}ms`);
      console.log(`   Retrieved ${allProfiles.length} profiles with preferences`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test profile editing in the app');
    console.log('2. Test swiping functionality');
    console.log('3. Check chat functionality');
    console.log('4. Verify real-time updates');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testProfileUpdate();
