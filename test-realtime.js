// Test script to verify Supabase real-time functionality
// Run this in Node.js to test if real-time is working

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zfnwtnqwokwvuxxwxgsr.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmbnd0bnF3b2t3dnV4eHd4Z3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU1ODg3ODAsImV4cCI6MjA0MTE2NDc4MH0.8f5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log('🧪 Testing Supabase Real-time...');

  // Test 1: Check if we can connect
  console.log('\n1. Testing basic connection...');
  try {
    const { data, error } = await supabase.from('messages').select('count').limit(1);
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful');
    }
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }

  // Test 2: Test real-time subscription
  console.log('\n2. Testing real-time subscription...');
  try {
    const channel = supabase.channel('test-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        console.log('✅ Real-time event received:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Real-time subscription timed out');
        }
      });

    // Wait 5 seconds then cleanup
    setTimeout(() => {
      console.log('\n🧹 Cleaning up subscription...');
      supabase.removeChannel(channel);
      console.log('✅ Test completed');
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Real-time test error:', error.message);
  }
}

testRealtime();
