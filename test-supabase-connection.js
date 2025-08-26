const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
  console.log('🔧 Testing Supabase Connection...\n');

  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing basic connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection error:', error.message);
      console.log('Error details:', error);
      return;
    }

    console.log('✅ Supabase connection successful!');

    // Test 2: Try to insert a test user
    console.log('\n2️⃣ Testing user insertion...');
    const testUserData = {
      phone_number: '916204691688',
      is_verified: true,
      verification_status: 'verified',
      verification_date: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      login_count: 1,
      device_id: 'test-device-123',
      ip_address: '127.0.0.1',
      profile_completion_percentage: 30,
      status: 'online'
    };

    console.log('📋 Test user data:');
    console.log(JSON.stringify(testUserData, null, 2));

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([testUserData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      console.log('Error details:', insertError);
      
      if (insertError.message.includes('row-level security policy')) {
        console.log('\n💡 RLS Policy Issue Detected!');
        console.log('=====================================');
        console.log('The Row Level Security (RLS) is blocking the insertion.');
        console.log('This is a security feature in Supabase.');
        console.log('');
        console.log('To fix this, you need to:');
        console.log('1. Go to Supabase Dashboard');
        console.log('2. Navigate to Authentication > Policies');
        console.log('3. Find the "users" table');
        console.log('4. Click the toggle to disable RLS temporarily');
        console.log('5. Test again');
        console.log('6. Re-enable RLS after testing');
      }
      return;
    }

    console.log('\n✅ User insertion successful!');
    console.log('User ID:', newUser.id);
    console.log('Phone:', newUser.phone_number);

    // Test 3: Clean up - delete the test user
    console.log('\n3️⃣ Cleaning up test user...');
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', newUser.id);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError.message);
    } else {
      console.log('✅ Test user deleted successfully!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the test
testSupabaseConnection();
