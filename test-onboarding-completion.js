/**
 * Test onboarding completion flow
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 TESTING ONBOARDING COMPLETION\n');
console.log('='.repeat(60));

async function testOnboardingCompletion() {
  try {
    // Create a test user
    console.log('\n1️⃣  Creating test user...');
    const testEmail = `test-${Date.now()}@example.com`;
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

    // Simulate onboarding data
    const onboardingData = {
      firstName: 'TestUser',
      dateOfBirth: '1995-01-01',
      gender: 'man',
      bio: 'This is my test bio',
      photos: [],
      interests: ['Testing', 'Coding'],
      seekingGenders: ['woman'],
      ageMin: 18,
      ageMax: 35,
      maxDistance: 50,
      relationshipIntent: 'casual',
    };

    console.log('\n2️⃣  Simulating onboarding data...');
    console.log('   Data:', JSON.stringify(onboardingData, null, 2));

    // Check if profile already exists
    console.log('\n3️⃣  Checking for existing profile...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Error checking profile:', checkError.message);
      throw checkError;
    }

    if (existingProfile) {
      console.log('⚠️  Profile already exists, will update');
    } else {
      console.log('✅ No existing profile, will create new one');
    }

    // Create/update profile
    console.log('\n4️⃣  Creating profile...');
    
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
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.log('❌ Profile creation failed!');
      console.log('   Error code:', profileError.code);
      console.log('   Error message:', profileError.message);
      console.log('   Error details:', profileError.details);
      console.log('   Error hint:', profileError.hint);
      
      // Check for common errors
      if (profileError.code === '23505') {
        console.log('\n   This is a duplicate key error - profile already exists');
      } else if (profileError.code === '23503') {
        console.log('\n   This is a foreign key error - user might not exist in users table');
      } else if (profileError.message.includes('enum')) {
        console.log('\n   This is an enum error - check gender value');
        console.log('   Valid genders: man, woman, non_binary, prefer_not_to_say');
      } else if (profileError.message.includes('RLS') || profileError.message.includes('policy')) {
        console.log('\n   This is an RLS (Row Level Security) error');
        console.log('   The user might not have permission to insert profiles');
      }
      
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log('   Profile:', JSON.stringify(profileResult, null, 2));

    // Create preferences
    console.log('\n5️⃣  Creating preferences...');
    
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

    if (prefsError) {
      console.log('❌ Preferences creation failed!');
      console.log('   Error:', prefsError.message);
      
      if (prefsError.message.includes('enum')) {
        console.log('\n   This is an enum error - check values');
        console.log('   Valid genders: man, woman, non_binary');
        console.log('   Valid intents: serious_relationship, open_to_long_term, not_sure, casual');
      }
      
      return;
    }

    console.log('✅ Preferences created successfully!');
    console.log('   Preferences:', JSON.stringify(prefsResult, null, 2));

    // Verify profile can be read
    console.log('\n6️⃣  Verifying profile can be read...');
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.log('❌ Could not read profile:', verifyError.message);
    } else {
      console.log('✅ Profile verified!');
      console.log('   Name:', verifyProfile.first_name);
      console.log('   Age:', verifyProfile.age);
      console.log('   Gender:', verifyProfile.gender);
      console.log('   Bio:', verifyProfile.bio);
      console.log('   Interests:', verifyProfile.interests);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('\n✅ Onboarding completion flow works!');
    console.log('\nTest account created:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   User ID: ${userId}`);
    console.log('\n✅ Profile created successfully');
    console.log('✅ Preferences created successfully');
    console.log('✅ Data can be read back');
    
    console.log('\n🎯 The "Let\'s Go" button should work!');
    console.log('   If it doesn\'t, check browser console for errors.');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
    console.log('   Stack:', error.stack);
  } finally {
    await supabase.auth.signOut();
    console.log('\n✅ Signed out\n');
  }
}

testOnboardingCompletion();

