#!/usr/bin/env node

// Script to delete all test users from Supabase
// Run with: node delete-all-test-users.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
// Note: This requires service_role key, not anon key
// You'll need to get this from Supabase Dashboard → Settings → API

console.log('⚠️  WARNING: This script requires the SERVICE ROLE key');
console.log('📋 Manual deletion is safer and recommended\n');
console.log('=====================================\n');
console.log('🔧 MANUAL DELETION STEPS:');
console.log('=====================================\n');
console.log('1. Go to: https://supabase.com/dashboard/project/zfnwtnqwokwvuxxwxgsr/auth/users\n');
console.log('2. Find each test user:');
console.log('   - sarah.test@gmail.com');
console.log('   - mike.test@gmail.com');
console.log('   - sarah.new@gmail.com');
console.log('   - mike.new@gmail.com');
console.log('   - Any other test accounts\n');
console.log('3. For each user:');
console.log('   - Click the ⋮ (three dots) button');
console.log('   - Click "Delete User"');
console.log('   - Confirm deletion\n');
console.log('4. All data (profiles, preferences, swipes) will be deleted automatically\n');
console.log('=====================================\n');
console.log('✅ After deletion, you can create fresh accounts that will work properly!\n');

// Alternative: Show SQL to run in Supabase SQL Editor
console.log('OR run this SQL in Supabase SQL Editor:');
console.log('=====================================\n');
console.log(`
-- Delete all users (CAREFUL! This deletes ALL users including yours!)
-- Better to delete individually in the dashboard

-- To see all users first:
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

-- To delete specific user (replace EMAIL with actual email):
-- DELETE FROM auth.users WHERE email = 'sarah.test@gmail.com';
-- DELETE FROM auth.users WHERE email = 'mike.test@gmail.com';

-- The CASCADE will automatically delete related data:
-- - profiles
-- - preferences  
-- - swipes
-- - swipe_counters
-- - matches
-- - messages
`);
console.log('=====================================\n');
console.log('🚀 After deleting, create fresh accounts with email confirmation OFF!\n');
