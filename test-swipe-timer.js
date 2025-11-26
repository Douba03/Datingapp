const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSwipeTimer() {
  console.log('🧪 Testing Swipe Counter and 12-Hour Timer\n');

  try {
    // Get test user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }

    console.log(`✅ Testing with user: ${user.email}\n`);

    // Test 1: Check current swipe counter
    console.log('Test 1: Check current swipe counter');
    const { data: counter, error: counterError } = await supabase
      .from('swipe_counters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (counterError) {
      console.log('⚠️  No swipe counter found, creating one...');
      const { data: newCounter, error: createError } = await supabase
        .from('swipe_counters')
        .insert({ user_id: user.id, remaining: 10 })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create swipe counter:', createError.message);
        return;
      }
      console.log('✅ Created new swipe counter with 10 swipes');
      console.log('Counter:', newCounter);
    } else {
      console.log('✅ Found swipe counter:');
      console.log(`   Remaining: ${counter.remaining}`);
      console.log(`   Last exhausted: ${counter.last_exhausted_at}`);
      console.log(`   Next refill: ${counter.next_refill_at}`);
      console.log(`   Updated at: ${counter.updated_at}`);
    }

    console.log('\n');

    // Test 2: Simulate swipes to exhaust counter quickly
    console.log('Test 2: Simulate exhausting swipes');
    
    // First, get a test profile to swipe on
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name')
      .neq('user_id', user.id)
      .limit(1);

    if (profilesError || !profiles || profiles.length === 0) {
      console.log('⚠️  No profiles available to swipe on. Creating test scenario...');
      
      // Manually set counter to 0 with 1 minute timer
      const { error: updateError } = await supabase
        .from('swipe_counters')
        .update({
          remaining: 0,
          last_exhausted_at: new Date().toISOString(),
          next_refill_at: new Date(Date.now() + 1 * 60 * 1000).toISOString(), // 1 minute from now
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Failed to simulate exhausted counter:', updateError.message);
      } else {
        console.log('✅ Simulated exhausted counter with 1-minute refill timer');
      }
    } else {
      console.log(`✅ Found profile to swipe: ${profiles[0].first_name}`);
      
      // Perform a test swipe
      console.log('   Performing test swipe...');
      const { data: swipeResult, error: swipeError } = await supabase.rpc('record_swipe', {
        swiper_uuid: user.id,
        target_uuid: profiles[0].user_id,
        swipe_action: 'like'
      });

      if (swipeError) {
        console.error('❌ Swipe failed:', swipeError.message);
      } else {
        console.log('✅ Swipe successful!');
        console.log(`   Remaining: ${swipeResult.remaining}`);
        console.log(`   Is match: ${swipeResult.is_match}`);
      }
    }

    console.log('\n');

    // Test 3: Test the refill function
    console.log('Test 3: Test refill function');
    
    // First, manually exhaust swipes
    const { error: exhaustError } = await supabase
      .from('swipe_counters')
      .update({
        remaining: 0,
        last_exhausted_at: new Date().toISOString(),
        next_refill_at: new Date().toISOString(), // Set to now for immediate refill
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (exhaustError) {
      console.error('❌ Failed to exhaust swipes:', exhaustError.message);
    } else {
      console.log('✅ Set swipes to 0 with immediate refill time');
      
      // Call the refill function
      console.log('   Calling refill function...');
      const { error: refillError } = await supabase.rpc('check_and_refill_swipes');

      if (refillError) {
        console.error('❌ Refill function failed:', refillError.message);
      } else {
        console.log('✅ Refill function called successfully');
        
        // Check if swipes were refilled
        const { data: refilledCounter, error: checkError } = await supabase
          .from('swipe_counters')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (checkError) {
          console.error('❌ Failed to check refilled counter:', checkError.message);
        } else {
          console.log('✅ Counter after refill:');
          console.log(`   Remaining: ${refilledCounter.remaining}`);
          console.log(`   Should be 10 if refill worked`);
        }
      }
    }

    console.log('\n');

    // Test 4: Reset to normal state
    console.log('Test 4: Reset to normal state');
    const { error: resetError } = await supabase
      .from('swipe_counters')
      .update({
        remaining: 10,
        last_exhausted_at: null,
        next_refill_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (resetError) {
      console.error('❌ Failed to reset counter:', resetError.message);
    } else {
      console.log('✅ Reset counter to normal state (10 swipes, no timer)');
    }

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSwipeTimer();
