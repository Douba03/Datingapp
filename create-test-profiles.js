#!/usr/bin/env node

// Script to create test profiles for Partner Productivity App
// Run with: node create-test-profiles.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test profiles data
const testProfiles = [
  {
    email: 'sarah@test.com',
    password: 'test123456',
    profile: {
      first_name: 'Sarah',
      date_of_birth: '1995-03-15',
      gender: 'woman',
      bio: 'Entrepreneur and coffee addict ☕ Love hiking and building cool stuff. Looking for someone to share adventures with!',
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
      ],
      city: 'San Francisco',
      country: 'USA',
      is_verified: true
    },
    preferences: {
      seeking_genders: ['man'],
      age_min: 25,
      age_max: 35,
      max_distance_km: 50,
      relationship_intent: 'serious_relationship',
      interests: ['Entrepreneurship', 'Hiking', 'Coffee', 'Travel', 'Fitness']
    }
  },
  {
    email: 'mike@test.com',
    password: 'test123456',
    profile: {
      first_name: 'Mike',
      date_of_birth: '1992-07-22',
      gender: 'man',
      bio: 'Software engineer by day, chef by night 👨‍💻🍳 Love trying new recipes and working on side projects.',
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
      ],
      city: 'San Francisco',
      country: 'USA',
      is_verified: true
    },
    preferences: {
      seeking_genders: ['woman'],
      age_min: 23,
      age_max: 32,
      max_distance_km: 30,
      relationship_intent: 'open_to_long_term',
      interests: ['Tech', 'Cooking', 'Reading', 'Gaming', 'Music']
    }
  },
  {
    email: 'emma@test.com',
    password: 'test123456',
    profile: {
      first_name: 'Emma',
      date_of_birth: '1996-11-08',
      gender: 'woman',
      bio: 'Designer & yoga enthusiast 🧘‍♀️ Passionate about sustainable living and good conversations.',
      photos: [
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
      ],
      city: 'Los Angeles',
      country: 'USA',
      is_verified: false
    },
    preferences: {
      seeking_genders: ['man', 'woman'],
      age_min: 24,
      age_max: 35,
      max_distance_km: 40,
      relationship_intent: 'not_sure',
      interests: ['Design', 'Yoga', 'Art', 'Environment', 'Fashion']
    }
  },
  {
    email: 'alex@test.com',
    password: 'test123456',
    profile: {
      first_name: 'Alex',
      date_of_birth: '1994-05-30',
      gender: 'man',
      bio: 'Product manager & fitness junkie 💪 Building products that matter. Let\'s grab coffee and talk startups!',
      photos: [
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
      ],
      city: 'San Francisco',
      country: 'USA',
      is_verified: true
    },
    preferences: {
      seeking_genders: ['woman'],
      age_min: 24,
      age_max: 33,
      max_distance_km: 25,
      relationship_intent: 'serious_relationship',
      interests: ['Startups', 'Fitness', 'Marketing', 'Travel', 'Coffee']
    }
  },
  {
    email: 'jessica@test.com',
    password: 'test123456',
    profile: {
      first_name: 'Jessica',
      date_of_birth: '1993-09-12',
      gender: 'woman',
      bio: 'Marketing pro & dog mom 🐕 Wine lover, beach enthusiast, and always up for spontaneous adventures!',
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400'
      ],
      city: 'San Diego',
      country: 'USA',
      is_verified: true
    },
    preferences: {
      seeking_genders: ['man'],
      age_min: 26,
      age_max: 36,
      max_distance_km: 60,
      relationship_intent: 'open_to_long_term',
      interests: ['Marketing', 'Wine', 'Pets', 'Travel', 'Beach']
    }
  }
];

async function createTestProfiles() {
  console.log('🚀 Creating test profiles...\n');

  for (const testUser of testProfiles) {
    try {
      console.log(`Creating profile for ${testUser.profile.first_name}...`);

      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            onboarding_completed: true
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log(`  ⚠️  User ${testUser.email} already exists, skipping...`);
          continue;
        }
        throw signUpError;
      }

      if (!authData.user) {
        console.log(`  ❌ Failed to create user ${testUser.email}`);
        continue;
      }

      console.log(`  ✅ Auth user created: ${authData.user.id}`);

      // Wait a bit for user to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          ...testUser.profile,
          primary_photo_idx: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log(`  ❌ Profile error:`, profileError.message);
        continue;
      }

      console.log(`  ✅ Profile created`);

      // 3. Create preferences
      const { error: prefsError } = await supabase
        .from('preferences')
        .insert({
          user_id: authData.user.id,
          ...testUser.preferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (prefsError) {
        console.log(`  ❌ Preferences error:`, prefsError.message);
      } else {
        console.log(`  ✅ Preferences created`);
      }

      // 4. Create swipe counter
      const { error: counterError } = await supabase
        .from('swipe_counters')
        .insert({
          user_id: authData.user.id,
          remaining: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (counterError) {
        console.log(`  ❌ Swipe counter error:`, counterError.message);
      } else {
        console.log(`  ✅ Swipe counter created`);
      }

      console.log(`  🎉 ${testUser.profile.first_name} created successfully!\n`);

    } catch (error) {
      console.error(`  ❌ Error creating ${testUser.profile.first_name}:`, error.message, '\n');
    }
  }

  console.log('\n✨ All test profiles created!');
  console.log('\n📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testProfiles.forEach(user => {
    console.log(`  ${user.profile.first_name}: ${user.email} / ${user.password}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎮 You can now log in with any of these accounts and test swiping!');
}

createTestProfiles().catch(console.error);
