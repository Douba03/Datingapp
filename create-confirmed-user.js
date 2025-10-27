// COMPLETE WORKAROUND - Use Service Role to bypass all restrictions
// This will create a user and confirm them immediately

const { createClient } = require('@supabase/supabase-js');

// Use service role key (this bypasses RLS and email confirmation)
const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzkzODA1NSwiZXhwIjoyMDczNTE0MDU1fQ.YourServiceRoleKeyHere';

// Create client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createConfirmedUser() {
  console.log('🔧 Creating confirmed user with service role...');
  
  try {
    const testEmail = 'confirmed@test.com';
    const testPassword = 'password123';
    
    // Step 1: Create user in auth.users directly
    console.log('📝 Creating user in auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // This confirms the email immediately
    });
    
    if (authError) {
      console.log('❌ Auth user creation error:', authError.message);
      return;
    }
    
    console.log('✅ Auth user created:', authUser.user?.id);
    
    // Step 2: Create user in public.users
    console.log('👤 Creating user in public.users...');
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        auth_provider: 'email',
        status: 'active',
        onboarding_completed: false,
        is_premium: false,
      });
    
    if (publicError) {
      console.log('❌ Public user creation error:', publicError.message);
    } else {
      console.log('✅ Public user created successfully!');
    }
    
    // Step 3: Test login
    console.log('🔐 Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (loginError) {
      console.log('❌ Login error:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('Session active:', !!loginData.session);
    }
    
    console.log('');
    console.log('🎯 Test Credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('');
    console.log('Try logging in with these credentials in your app!');
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createConfirmedUser();
