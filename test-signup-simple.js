// Simple test to check if signup works
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log('Testing signup...');
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'test123456';
  
  console.log('Email:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    console.log('\n=== SIGNUP RESULT ===');
    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Code:', error.code);
      console.error('Details:', error);
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', data.user?.id);
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile not created:', profileError.message);
      } else {
        console.log('✅ Profile created:', profile);
      }
      
      // Check if preferences were created
      const { data: prefs, error: prefsError } = await supabase
        .from('preferences')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
      
      if (prefsError) {
        console.error('❌ Preferences not created:', prefsError.message);
      } else {
        console.log('✅ Preferences created:', prefs);
      }
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testSignup();

