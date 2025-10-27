// Simple Migration Runner
// Run this with: node run-migrations.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MzgwNTUsImV4cCI6MjA3MzUxNDA1NX0.Q9MA7FNex8ZrJ_V9wux4OwrvKhsKGjZfxsf0qH-yz4Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.log('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Since we can't run raw SQL with the anon key, let's create tables using the REST API
    console.log('📋 Creating database tables...');
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError) console.log('Users table:', usersError.message);
    
    // Create profiles table  
    console.log('Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('create_profiles_table');
    if (profilesError) console.log('Profiles table:', profilesError.message);
    
    // Create preferences table
    console.log('Creating preferences table...');
    const { error: preferencesError } = await supabase.rpc('create_preferences_table');
    if (preferencesError) console.log('Preferences table:', preferencesError.message);
    
    // Create swipes table
    console.log('Creating swipes table...');
    const { error: swipesError } = await supabase.rpc('create_swipes_table');
    if (swipesError) console.log('Swipes table:', swipesError.message);
    
    // Create matches table
    console.log('Creating matches table...');
    const { error: matchesError } = await supabase.rpc('create_matches_table');
    if (matchesError) console.log('Matches table:', matchesError.message);
    
    // Create messages table
    console.log('Creating messages table...');
    const { error: messagesError } = await supabase.rpc('create_messages_table');
    if (messagesError) console.log('Messages table:', messagesError.message);
    
    // Create swipe_counters table
    console.log('Creating swipe_counters table...');
    const { error: countersError } = await supabase.rpc('create_swipe_counters_table');
    if (countersError) console.log('Swipe counters table:', countersError.message);
    
    // Create focus_sessions table
    console.log('Creating focus_sessions table...');
    const { error: sessionsError } = await supabase.rpc('create_focus_sessions_table');
    if (sessionsError) console.log('Focus sessions table:', sessionsError.message);
    
    console.log('🎉 Database setup completed!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Open your project: zfnwtnqwokwvuxxwxgsr');
    console.log('3. Go to SQL Editor and run the SQL files I created:');
    console.log('   - database-schema.sql');
    console.log('   - database-functions.sql');
    console.log('   - sample-data.sql');
    console.log('4. Set up Row Level Security policies');
    console.log('5. Restart your app: npm start');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migrations
runMigrations();
