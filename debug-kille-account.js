/**
 * Debug the kille@test.com account issue
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔍 DEBUGGING kille@test.com ACCOUNT\n');
console.log('='.repeat(60));

async function debugKilleAccount() {
  try {
    // Sign in
    console.log('\n1️⃣  Signing in as kille@test.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'kille@test.com',
      password: 'test123456',
    });

    if (authError) {
      console.log('❌ Login failed:', authError.message);
      return;
    }

    const userId = authData.user.id;
    console.log('✅ Signed in successfully');
    console.log('   User ID:', userId);

    // Check profile
    console.log('\n2️⃣  Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      console.log('   Code:', profileError.code);
      
      if (profileError.code === 'PGRST116') {
        console.log('\n   ⚠️  NO PROFILE FOUND!');
        console.log('   This means onboarding didn\'t complete successfully.');
        console.log('   The profile was not created in the database.');
      }
    } else {
      console.log('✅ Profile found:');
      console.log('   Name:', profile.first_name || '❌ MISSING');
      console.log('   Age:', profile.age || '❌ MISSING');
      console.log('   Gender:', profile.gender || '❌ MISSING');
      console.log('   Bio:', profile.bio || '❌ MISSING');
      console.log('   Interests:', profile.interests || []);
      console.log('   Photos:', profile.photos || []);
      console.log('   Photos count:', profile.photos?.length || 0);
      
      // Check if photos are valid URLs
      if (profile.photos && profile.photos.length > 0) {
        console.log('\n   📷 Photo Analysis:');
        profile.photos.forEach((photo, i) => {
          const isValidUrl = photo.startsWith('http://') || photo.startsWith('https://');
          const isLocalUri = photo.startsWith('file://') || photo.startsWith('blob:');
          console.log(`   Photo ${i + 1}:`);
          console.log(`     URL: ${photo.substring(0, 60)}...`);
          console.log(`     Valid URL: ${isValidUrl ? '✅' : '❌'}`);
          console.log(`     Local URI: ${isLocalUri ? '⚠️  YES (will not work!)' : '✅ No'}`);
        });
      }
      
      // Check for issues
      console.log('\n   🔍 Issues Found:');
      const issues = [];
      
      if (!profile.first_name || profile.first_name === '30') {
        issues.push('❌ Name is missing or invalid (shows "30")');
      }
      
      if (!profile.bio || profile.bio.length === 0) {
        issues.push('⚠️  Bio is empty');
      }
      
      if (!profile.interests || profile.interests.length === 0) {
        issues.push('⚠️  No interests selected');
      }
      
      if (!profile.photos || profile.photos.length === 0) {
        issues.push('⚠️  No photos uploaded');
      } else {
        const hasLocalUris = profile.photos.some(p => 
          p.startsWith('file://') || p.startsWith('blob:')
        );
        if (hasLocalUris) {
          issues.push('❌ Photos are local URIs (not uploaded to storage)');
        }
      }
      
      if (issues.length > 0) {
        issues.forEach(issue => console.log(`   ${issue}`));
      } else {
        console.log('   ✅ No issues found!');
      }
    }

    // Check preferences
    console.log('\n3️⃣  Checking preferences...');
    const { data: prefs, error: prefsError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError) {
      console.log('❌ Preferences error:', prefsError.message);
      if (prefsError.code === 'PGRST116') {
        console.log('   ⚠️  NO PREFERENCES FOUND!');
      }
    } else {
      console.log('✅ Preferences found:');
      console.log('   Seeking:', prefs.seeking_genders);
      console.log('   Age range:', prefs.age_min, '-', prefs.age_max);
      console.log('   Max distance:', prefs.max_distance_km, 'km');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS');
    console.log('='.repeat(60));
    
    if (!profile) {
      console.log('\n❌ CRITICAL: Profile not created!');
      console.log('\nPossible causes:');
      console.log('1. Onboarding didn\'t complete (got stuck)');
      console.log('2. Database error during profile creation');
      console.log('3. RLS policy blocking insert');
      console.log('\nSolution:');
      console.log('- Complete onboarding again');
      console.log('- Check browser console for errors');
      console.log('- Make sure to fill ALL required fields');
    } else {
      console.log('\n✅ Profile exists');
      
      if (!profile.first_name || profile.first_name === '30') {
        console.log('\n❌ ISSUE: Name is "30" instead of actual name');
        console.log('\nCause: Onboarding data not saved correctly');
        console.log('The "30" is likely the age field being shown as name');
        console.log('\nSolution:');
        console.log('1. Edit profile in the app');
        console.log('2. Set correct name');
        console.log('3. Or delete account and start over');
      }
      
      if (profile.photos && profile.photos.length > 0) {
        const hasLocalUris = profile.photos.some(p => 
          p.startsWith('file://') || p.startsWith('blob:')
        );
        
        if (hasLocalUris) {
          console.log('\n❌ ISSUE: Photos are local URIs');
          console.log('\nCause: Photos not uploaded to Supabase Storage');
          console.log('Photos are stored as file:// or blob: URLs which don\'t work after refresh');
          console.log('\nSolution:');
          console.log('1. Create storage bucket "profile-pictures"');
          console.log('2. Apply RLS policies');
          console.log('3. Re-upload photos through the app');
        }
      }
    }

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
  } finally {
    await supabase.auth.signOut();
    console.log('\n✅ Signed out\n');
  }
}

debugKilleAccount();


