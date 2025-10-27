/**
 * Test onboarding after RLS fix
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 TESTING ONBOARDING AFTER RLS FIX\n');
console.log('='.repeat(60));

async function testOnboardingAfterFix() {
  try {
    // Create a test user
    console.log('\n1️⃣  Creating test user...');
    const testEmail = `test-fixed-${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message);
      return;
    }

    console.log('✅ User created:', testEmail);
    console.log('   User ID:', signUpData.user.id);

    const userId = signUpData.user.id;

    // Simulate the exact data from your console log
    const onboardingData = {
      firstName: 'tomas',
      dateOfBirth: '2000-12-31T23:00:00.000Z',
      gender: 'man',
      bio: "I'm passionate about...\n\nMy ideal weekend involves...\n\nI'm looking for someone who...\n\nYou should know that I...\n\nMy friends describe me as...\n\nI'm always down to...",
      photos: [
        'https://zfnwtnqwokwvuxxwxgsr.supabase.co/storage/v1/object/public/profile-pictures/e99df22c-fee1-4b10-a32b-49710479f800/1760381306260.png',
        'https://zfnwtnqwokwvuxxwxgsr.supabase.co/storage/v1/object/public/profile-pictures/e99df22c-fee1-4b10-a32b-49710479f800/1760381306261.png'
      ],
      interests: ['Running', 'Music', 'Wine', 'Tech', 'Environment'],
      seekingGenders: ['woman'],
      ageMin: 22,
      ageMax: 35,
      maxDistance: 50,
      relationshipIntent: 'serious_relationship',
      city: 'Unknown',
      country: 'Unknown',
    };

    console.log('\n2️⃣  Testing profile creation...');
    console.log('   Data matches your console log exactly');
    
    const startTime = Date.now();
    
    // Create profile
    const profileData = {
      user_id: userId,
      first_name: onboardingData.firstName,
      date_of_birth: onboardingData.dateOfBirth,
      gender: onboardingData.gender,
      bio: onboardingData.bio,
      photos: onboardingData.photos,
      interests: onboardingData.interests,
      age: new Date().getFullYear() - new Date(onboardingData.dateOfBirth).getFullYear(),
      primary_photo_idx: 0,
      city: onboardingData.city,
      country: onboardingData.country,
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    const profileTime = Date.now() - startTime;
    console.log(`   Profile creation took: ${profileTime}ms`);

    if (profileError) {
      console.log('❌ Profile creation failed!');
      console.log('   Error:', profileError.message);
      console.log('   Code:', profileError.code);
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log('   Name:', profileResult.first_name);
    console.log('   Age:', profileResult.age);
    console.log('   Photos:', profileResult.photos?.length || 0);

    // Create preferences
    console.log('\n3️⃣  Testing preferences creation...');
    
    const prefsStartTime = Date.now();
    
    const preferencesData = {
      user_id: userId,
      seeking_genders: onboardingData.seekingGenders,
      age_min: onboardingData.ageMin,
      age_max: onboardingData.ageMax,
      max_distance_km: onboardingData.maxDistance,
      relationship_intent: onboardingData.relationshipIntent,
    };

    const { data: prefsResult, error: prefsError } = await supabase
      .from('preferences')
      .insert(preferencesData)
      .select()
      .single();

    const prefsTime = Date.now() - prefsStartTime;
    console.log(`   Preferences creation took: ${prefsTime}ms`);

    if (prefsError) {
      console.log('❌ Preferences creation failed!');
      console.log('   Error:', prefsError.message);
      return;
    }

    console.log('✅ Preferences created successfully!');

    // Test reading the data back
    console.log('\n4️⃣  Testing data retrieval...');
    
    const readStartTime = Date.now();
    
    const { data: readProfile, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const readTime = Date.now() - readStartTime;
    console.log(`   Profile read took: ${readTime}ms`);

    if (readError) {
      console.log('❌ Could not read profile:', readError.message);
    } else {
      console.log('✅ Profile read successfully!');
      console.log('   Name:', readProfile.first_name);
      console.log('   Bio length:', readProfile.bio?.length || 0);
      console.log('   Interests:', readProfile.interests?.length || 0);
      console.log('   Photos:', readProfile.photos?.length || 0);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Timing Results:`);
    console.log(`   Profile creation: ${profileTime}ms`);
    console.log(`   Preferences creation: ${prefsTime}ms`);
    console.log(`   Profile read: ${readTime}ms`);
    console.log(`   Total time: ${profileTime + prefsTime + readTime}ms`);
    
    if (profileTime + prefsTime + readTime < 5000) {
      console.log('\n✅ EXCELLENT! All operations under 5 seconds');
      console.log('   The timeout issue is fixed!');
    } else if (profileTime + prefsTime + readTime < 10000) {
      console.log('\n✅ GOOD! Operations under 10 seconds');
      console.log('   Should work fine in the app');
    } else {
      console.log('\n⚠️  SLOW! Operations taking over 10 seconds');
      console.log('   May still timeout in the app');
    }

    console.log('\n🎯 Test account created:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n✅ You can use this account to test the app!');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
  } finally {
    await supabase.auth.signOut();
    console.log('\n✅ Signed out\n');
  }
}

testOnboardingAfterFix();

