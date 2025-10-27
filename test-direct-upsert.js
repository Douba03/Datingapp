/**
 * Test direct upsert approach (no custom function)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 TESTING DIRECT UPSERT APPROACH\n');
console.log('='.repeat(60));

async function testDirectUpsert() {
  try {
    // Create a test user
    console.log('\n1️⃣  Creating test user...');
    const testEmail = `direct-test-${Date.now()}@example.com`;
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

    // Calculate age
    const dateOfBirth = '1995-01-01';
    const calculatedAge = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();

    // Test direct upsert approach
    console.log('\n2️⃣  Testing direct upsert...');
    
    const startTime = Date.now();
    
    // Create profile data
    const profileData = {
      user_id: userId,
      first_name: 'DirectTest',
      date_of_birth: dateOfBirth,
      gender: 'man',
      custom_gender: null,
      bio: 'Testing direct upsert approach',
      photos: ['https://example.com/photo1.jpg'],
      primary_photo_idx: 0,
      location: null,
      city: 'Test City',
      country: 'Test Country',
      interests: ['Testing', 'Direct Upsert'],
      age: calculatedAge,
    };

    console.log('📋 Profile data:', profileData);

    // Insert/update profile
    const { data: profileResult, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (profileError) {
      console.log('❌ Profile upsert failed!');
      console.log('   Error:', profileError.message);
      console.log('   Code:', profileError.code);
      return;
    }

    console.log('✅ Profile upsert successful!');
    console.log('   Name:', profileResult.first_name);
    console.log('   Age:', profileResult.age);

    // Create preferences data
    const preferencesData = {
      user_id: userId,
      seeking_genders: ['woman'],
      age_min: 22,
      age_max: 35,
      max_distance_km: 50,
      relationship_intent: 'casual',
    };

    // Insert/update preferences
    const { data: prefsResult, error: prefsError } = await supabase
      .from('preferences')
      .upsert(preferencesData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (prefsError) {
      console.log('❌ Preferences upsert failed!');
      console.log('   Error:', prefsError.message);
      console.log('   Code:', prefsError.code);
      return;
    }

    const totalTime = Date.now() - startTime;
    console.log('✅ Preferences upsert successful!');
    console.log(`   Total time: ${totalTime}ms`);

    // Verify data was saved
    console.log('\n3️⃣  Verifying saved data...');
    
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.log('❌ Could not verify profile:', verifyError.message);
    } else {
      console.log('✅ Profile verified:');
      console.log('   Name:', verifyProfile.first_name);
      console.log('   Age:', verifyProfile.age);
      console.log('   Bio:', verifyProfile.bio);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIRECT UPSERT TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Performance:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Profile created: ✅`);
    console.log(`   Preferences created: ✅`);
    
    if (totalTime < 1000) {
      console.log('\n✅ EXCELLENT! Direct upsert under 1 second');
      console.log('   This approach works perfectly!');
    } else {
      console.log('\n⚠️  Slower than expected but still working');
    }

    console.log('\n🎯 Test account created:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n✅ Direct upsert approach works!');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
    console.log('   Stack:', error.stack);
  } finally {
    await supabase.auth.signOut();
    console.log('\n✅ Signed out\n');
  }
}

testDirectUpsert();

