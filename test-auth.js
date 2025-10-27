// Test Authentication Script
// Run with: node test-auth.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🧪 Testing Authentication...');
  
  try {
    // Test 1: Check current session
    console.log('📋 Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User is logged in:', session.user.email);
    } else {
      console.log('ℹ️ No active session - user needs to log in');
    }
    
    // Test 2: Try to sign up a test user
    console.log('📝 Testing sign up...');
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('ℹ️ Test user already exists, trying to sign in...');
        
        // Try to sign in instead
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
        
        if (signInError) {
          console.log('❌ Sign in error:', signInError.message);
        } else {
          console.log('✅ Successfully signed in test user!');
          console.log('📧 Email:', signInData.user?.email);
          console.log('🆔 User ID:', signInData.user?.id);
        }
      } else {
        console.log('❌ Sign up error:', signUpError.message);
      }
    } else {
      console.log('✅ Successfully created test user!');
      console.log('📧 Email:', signUpData.user?.email);
      console.log('🆔 User ID:', signUpData.user?.id);
      
      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        console.log('⚠️ User needs to confirm email before logging in');
      }
    }
    
    // Test 3: Check if user exists in our users table
    console.log('👤 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Users table error:', usersError.message);
    } else {
      console.log(`✅ Found ${users?.length || 0} users in database`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`  - ${user.email} (${user.status})`);
        });
      }
    }
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Go to your app at http://localhost:8081');
    console.log('2. Use these credentials to test:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('3. If signup fails, try signing in instead');
    console.log('4. Check your email for confirmation if needed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();
