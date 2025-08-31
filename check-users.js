const { supabaseAdmin } = require('./config/supabase');

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users
    const { data: allUsers, error: allError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone_number, status, is_active, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching users:', allError);
      return;
    }
    
    console.log(`📊 Total users in database: ${allUsers.length}\n`);
    
    if (allUsers.length > 0) {
      console.log('👥 All Users:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Phone: ${user.phone_number}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Active: ${user.is_active}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
    
    // Check for online users specifically
    const { data: onlineUsers, error: onlineError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone_number, status')
      .eq('status', 'online')
      .eq('is_active', true);
    
    if (onlineError) {
      console.error('❌ Error fetching online users:', onlineError);
      return;
    }
    
    console.log(`🌐 Online users: ${onlineUsers.length}`);
    if (onlineUsers.length > 0) {
      onlineUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.phone_number})`);
      });
    } else {
      console.log('⚠️ No online users found');
    }
    
    // Check for the specific user from the token
    const tokenUserId = '5efc1f51-9e30-4b8c-b733-779507a59e08';
    const { data: specificUser, error: specificError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', tokenUserId)
      .single();
    
    console.log(`\n🔍 Looking for token user (${tokenUserId}):`);
    if (specificError) {
      console.log('❌ User not found in database');
      console.log('💡 This user might have been deleted or never existed');
    } else {
      console.log('✅ User found:');
      console.log(JSON.stringify(specificUser, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
