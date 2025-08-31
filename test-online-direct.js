const { supabaseAdmin } = require('./config/supabase');

async function testOnlineUsersDirect() {
  try {
    console.log('🧪 Testing Online Users API Directly (Bypassing Auth)...\n');
    
    const currentUserId = '5efc1f51-9e30-4b8c-b733-779507a59e08';
    
    console.log('🔍 Current User ID:', currentUserId);
    
    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'online')
      .eq('is_active', true)
      .neq('id', currentUserId);

    if (countError) {
      console.error('❌ Error getting total count:', countError);
      return;
    }

    console.log(`📊 Total online users (excluding current user): ${totalCount}`);

    // Fetch online users with pricing data using LEFT JOIN
    const { data: onlineUsers, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        age,
        avatar_url,
        status,
        last_seen,
        is_active,
        user_pricing(
          sms_cost,
          audio_call_cost,
          video_call_cost,
          is_active
        )
      `)
      .eq('status', 'online')
      .eq('is_active', true)
      .neq('id', currentUserId)
      .order('last_seen', { ascending: false })
      .range(0, 4); // First 5 users

    if (error) {
      console.error('❌ Database error:', error);
      return;
    }

    console.log(`✅ Found ${onlineUsers.length} online users\n`);

    // Process users with pricing data
    const usersWithPricing = onlineUsers.map(user => {
      // Get pricing data or use defaults
      const pricing = user.user_pricing && user.user_pricing.length > 0 
        ? user.user_pricing[0] 
        : { 
            sms_cost: 10.00, 
            audio_call_cost: 25.00, 
            video_call_cost: 50.00 
          };
      
      // Calculate dynamic costs based on user attributes
      let smsCost = parseFloat(pricing.sms_cost);
      let audioCallCost = parseFloat(pricing.audio_call_cost);
      let videoCallCost = parseFloat(pricing.video_call_cost);
      
      // Adjust costs based on user attributes
      if (user.age && user.age < 25) {
        smsCost += 5;        // Younger users cost more
        audioCallCost += 10;
        videoCallCost += 20;
      }
      
      if (user.location && (user.location === 'New York' || user.location === 'Los Angeles')) {
        smsCost += 3;        // Premium locations cost more
        audioCallCost += 8;
        videoCallCost += 15;
      }
      
      return {
        id: user.id,
        name: user.name,
        age: user.age,
        profile_picture: user.avatar_url,
        status: user.status,
        last_seen: user.last_seen,
        is_active: user.is_active,
        pricing: {
          sms_cost: Math.round(smsCost * 100) / 100,
          audio_call_cost: Math.round(audioCallCost * 100) / 100,
          video_call_cost: Math.round(videoCallCost * 100) / 100
        }
      };
    });

    console.log('👥 Processed Users with Pricing:');
    usersWithPricing.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.age} years)`);
      console.log(`   Status: ${user.status}`);
      console.log(`   SMS: ₹${user.pricing.sms_cost}`);
      console.log(`   Audio Call: ₹${user.pricing.audio_call_cost}`);
      console.log(`   Video Call: ₹${user.pricing.video_call_cost}`);
      console.log('');
    });

    // Check if user_pricing table has data
    console.log('💰 Checking user_pricing table...');
    const { data: pricingData, error: pricingError } = await supabaseAdmin
      .from('user_pricing')
      .select('*');

    if (pricingError) {
      console.error('❌ Error fetching pricing data:', pricingError);
    } else {
      console.log(`📊 Found ${pricingData.length} pricing records`);
      if (pricingData.length > 0) {
        console.log('Sample pricing record:', pricingData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOnlineUsersDirect();
