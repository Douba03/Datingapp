#!/usr/bin/env node

// Script to check profiles in Supabase database
// Run with: node check-profiles.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  console.log('🔍 Checking Supabase database...\n');

  try {
    // Check auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    console.log('👥 AUTH USERS:');
    console.log('═══════════════════════════════════════\n');
    
    // Since we don't have admin access, let's check profiles directly
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.log('❌ Error fetching profiles:', profileError.message);
      console.log('\n⚠️  This might mean:');
      console.log('   1. Profiles table doesn\'t exist');
      console.log('   2. RLS policies are blocking SELECT');
      console.log('   3. You need to run database-schema.sql\n');
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profiles in database\n`);
      
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`Profile ${index + 1}:`);
          console.log(`  Name: ${profile.first_name}`);
          console.log(`  Gender: ${profile.gender}`);
          console.log(`  Age: ${profile.age}`);
          console.log(`  City: ${profile.city}`);
          console.log(`  Photos: ${profile.photos?.length || 0}`);
          console.log(`  Bio: ${profile.bio?.substring(0, 50)}...`);
          console.log('');
        });
      } else {
        console.log('❌ No profiles found!');
        console.log('   This means accounts were created but profiles were NOT saved.\n');
      }
    }

    // Check preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('preferences')
      .select('*');

    if (!prefsError && preferences) {
      console.log(`\n⚙️  Found ${preferences.length} preference records`);
      preferences.forEach((pref, index) => {
        console.log(`  ${index + 1}. Seeking: ${pref.seeking_genders?.join(', ')}, Age: ${pref.age_min}-${pref.age_max}`);
      });
    }

    // Check swipe counters
    const { data: counters, error: counterError } = await supabase
      .from('swipe_counters')
      .select('*');

    if (!counterError && counters) {
      console.log(`\n🔢 Found ${counters.length} swipe counters`);
      counters.forEach((counter, index) => {
        console.log(`  ${index + 1}. Remaining swipes: ${counter.remaining}`);
      });
    }

    console.log('\n═══════════════════════════════════════\n');

    // Give recommendations
    if (!profiles || profiles.length === 0) {
      console.log('🚨 PROBLEM: No profiles in database!\n');
      console.log('📋 TO FIX:');
      console.log('   1. Make sure database tables exist (run database-schema.sql)');
      console.log('   2. Make sure RLS policies allow inserts');
      console.log('   3. Create new account AFTER fixing database');
      console.log('   4. Check console logs during onboarding\n');
    } else {
      console.log('✅ Profiles exist! If you can\'t see them in Discover:');
      console.log('   1. Check if preferences match');
      console.log('   2. Check age ranges overlap');
      console.log('   3. Check same/nearby location');
      console.log('   4. Open browser console (F12) for errors\n');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.log('\n⚠️  Can\'t access database. Check:');
    console.log('   1. Supabase project is running');
    console.log('   2. API keys are correct');
    console.log('   3. Tables exist in database\n');
  }
}

checkProfiles();



