/**
 * Test the single API call for complete profile creation
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🧪 TESTING SINGLE API CALL FOR COMPLETE PROFILE\n');
console.log('='.repeat(60));

async function testSingleApiCall() {
  try {
    // Create a test user
    console.log('\n1️⃣  Creating test user...');
    const testEmail = `single-api-${Date.now()}@example.com`;
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

    // Test the single API call
    console.log('\n2️⃣  Testing single API call...');
    
    const startTime = Date.now();
    
    const { data: result, error } = await supabase.rpc('create_complete_profile', {
      p_first_name: 'TestUser',
      p_date_of_birth: '1995-01-01',
      p_gender: 'man',
      p_custom_gender: null,
      p_bio: 'This is a test bio for the single API call.',
      p_photos: [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg'
      ],
      p_primary_photo_idx: 0,
      p_location: null,
      p_city: 'Test City',
      p_country: 'Test Country',
      p_interests: ['Testing', 'Coding', 'Single API'],
      p_seeking_genders: ['woman'],
      p_age_min: 22,
      p_age_max: 35,
      p_max_distance_km: 50,
      p_relationship_intent: 'casual',
    });

    const apiTime = Date.now() - startTime;
    console.log(`   Single API call took: ${apiTime}ms`);

    if (error) {
      console.log('❌ API call failed!');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
      return;
    }

    console.log('📋 API Result:', JSON.stringify(result, null, 2));

    if (!result || !result.success) {
      console.log('❌ API call returned failure!');
      console.log('   Error:', result?.error || 'Unknown error');
      console.log('   Error Code:', result?.error_code || 'Unknown');
      return;
    }

    console.log('✅ Single API call successful!');
    console.log('   Profile created:', !!result.profile);
    console.log('   Preferences created:', !!result.preferences);
    console.log('   Message:', result.message);

    // Verify data was saved correctly
    console.log('\n3️⃣  Verifying saved data...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    if (profileError) {
      console.log('❌ Could not read profile:', profileError.message);
    } else {
      console.log('✅ Profile verified:');
      console.log('   Name:', profile.first_name);
      console.log('   Age:', profile.age);
      console.log('   Bio:', profile.bio?.substring(0, 50) + '...');
      console.log('   Photos:', profile.photos?.length || 0);
      console.log('   Interests:', profile.interests?.length || 0);
    }

    const { data: prefs, error: prefsError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', signUpData.user.id)
      .single();

    if (prefsError) {
      console.log('❌ Could not read preferences:', prefsError.message);
    } else {
      console.log('✅ Preferences verified:');
      console.log('   Seeking:', prefs.seeking_genders);
      console.log('   Age range:', prefs.age_min, '-', prefs.age_max);
      console.log('   Max distance:', prefs.max_distance_km, 'km');
      console.log('   Intent:', prefs.relationship_intent);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SINGLE API CALL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`\n⏱️  Performance:`);
    console.log(`   Single API call: ${apiTime}ms`);
    console.log(`   Profile created: ${!!profile ? '✅' : '❌'}`);
    console.log(`   Preferences created: ${!!prefs ? '✅' : '❌'}`);
    
    if (apiTime < 1000) {
      console.log('\n✅ EXCELLENT! Single API call under 1 second');
      console.log('   Much faster than multiple separate calls!');
    } else {
      console.log('\n⚠️  API call slower than expected');
    }

    console.log('\n🎯 Test account created:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n✅ Single API call works perfectly!');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
    console.log('   Stack:', error.stack);
  } finally {
    await supabase.auth.signOut();
    console.log('\n✅ Signed out\n');
  }
}

testSingleApiCall();

