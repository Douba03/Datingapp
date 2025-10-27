// Debug Supabase Connection Issues
// Run with: node debug-supabase.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Test 1: Basic connection
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Basic connection failed:', error.message);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // Test 2: Auth service status
    console.log('🔐 Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service accessible');
    }
    
    // Test 3: Try a simple signup with detailed error
    console.log('📝 Testing signup with detailed error...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (signupError) {
      console.log('❌ Signup error details:');
      console.log('  Code:', signupError.status);
      console.log('  Message:', signupError.message);
      console.log('  Details:', signupError);
      
      // Check if it's a 500 error
      if (signupError.status === 500) {
        console.log('');
        console.log('🚨 500 Internal Server Error Detected!');
        console.log('');
        console.log('This usually means:');
        console.log('1. Database connection issues');
        console.log('2. Missing database triggers/functions');
        console.log('3. RLS policies blocking user creation');
        console.log('4. Supabase project configuration issues');
        console.log('');
        console.log('🔧 Solutions to try:');
        console.log('1. Check Supabase project status');
        console.log('2. Verify database is running');
        console.log('3. Check Auth settings in Supabase dashboard');
        console.log('4. Run the database setup SQL again');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User:', signupData.user?.email);
    }
    
    // Test 4: Check project status
    console.log('📊 Checking project status...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Project is accessible');
      } else {
        console.log('❌ Project returned:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.log('❌ Project check failed:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSupabase();
