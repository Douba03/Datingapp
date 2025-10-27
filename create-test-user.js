// Create a new user without email confirmation
// Run this to create a test user that should work

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  console.log('🧪 Creating a new test user...');
  
  try {
    // Create a new user with a different email
    const testEmail = 'testuser@example.com';
    const testPassword = 'password123';
    
    console.log('📝 Creating user:', testEmail);
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('❌ Signup error:', error.message);
    } else {
      console.log('✅ User created successfully!');
      console.log('User ID:', data.user?.id);
      console.log('Email confirmed:', data.user?.email_confirmed_at);
      
      // Try to sign in immediately
      console.log('🔐 Testing immediate sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.log('❌ Sign in error:', signInError.message);
      } else {
        console.log('✅ Sign in successful!');
        console.log('Session:', !!signInData.session);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createTestUser();
