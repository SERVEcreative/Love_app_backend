const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// Get user's current pricing
router.get('/my-pricing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('💰 Fetching pricing for user:', userId);

    const { data: pricing, error } = await supabaseAdmin
      .from('user_pricing')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Database error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to fetch pricing'
      });
    }

    // Return current pricing or null if not set
    res.json({
      success: true,
      pricing: pricing || null,
      message: pricing ? 'Pricing found' : 'No pricing set yet',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching user pricing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

// Set/Update user's pricing
router.post('/set-pricing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sms_cost, audio_call_cost, video_call_cost } = req.body;

    console.log('💰 Setting pricing for user:', userId);
    console.log('📊 New prices:', { sms_cost, audio_call_cost, video_call_cost });

    // Validate input
    if (sms_cost === undefined || audio_call_cost === undefined || video_call_cost === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All pricing fields are required'
      });
    }

    // Validate prices (must be positive numbers)
    if (sms_cost < 0 || audio_call_cost < 0 || video_call_cost < 0) {
      return res.status(400).json({
        success: false,
        error: 'Prices cannot be negative'
      });
    }

    // Check if pricing already exists
    const { data: existingPricing } = await supabaseAdmin
      .from('user_pricing')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;
    let isNew = false;

    if (existingPricing) {
      // Update existing pricing
      console.log('🔄 Updating existing pricing');
      const { data: updatedPricing, error } = await supabaseAdmin
        .from('user_pricing')
        .update({
          sms_cost: parseFloat(sms_cost),
          audio_call_cost: parseFloat(audio_call_cost),
          video_call_cost: parseFloat(video_call_cost),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating pricing:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update pricing'
        });
      }

      result = updatedPricing;
    } else {
      // Create new pricing
      console.log('🆕 Creating new pricing');
      isNew = true;
      const { data: newPricing, error } = await supabaseAdmin
        .from('user_pricing')
        .insert({
          user_id: userId,
          sms_cost: parseFloat(sms_cost),
          audio_call_cost: parseFloat(audio_call_cost),
          video_call_cost: parseFloat(video_call_cost),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating pricing:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create pricing'
        });
      }

      result = newPricing;
    }

    console.log('✅ Pricing set successfully for user:', userId);

    res.json({
      success: true,
      pricing: result,
      message: isNew ? 'Pricing created successfully' : 'Pricing updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error setting user pricing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update specific pricing field
router.patch('/update-pricing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sms_cost, audio_call_cost, video_call_cost } = req.body;

    console.log('💰 Updating pricing for user:', userId);
    console.log('📊 Update prices:', { sms_cost, audio_call_cost, video_call_cost });

    // Validate that at least one field is provided
    if (!sms_cost && !audio_call_cost && !video_call_cost) {
      return res.status(400).json({
        success: false,
        error: 'At least one pricing field must be provided'
      });
    }

    // Validate prices (must be positive numbers if provided)
    if ((sms_cost !== undefined && sms_cost < 0) || 
        (audio_call_cost !== undefined && audio_call_cost < 0) || 
        (video_call_cost !== undefined && video_call_cost < 0)) {
      return res.status(400).json({
        success: false,
        error: 'Prices cannot be negative'
      });
    }

    // Prepare update data
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (sms_cost !== undefined) updateData.sms_cost = parseFloat(sms_cost);
    if (audio_call_cost !== undefined) updateData.audio_call_cost = parseFloat(audio_call_cost);
    if (video_call_cost !== undefined) updateData.video_call_cost = parseFloat(video_call_cost);

    // Check if pricing exists
    const { data: existingPricing } = await supabaseAdmin
      .from('user_pricing')
      .select('*')
      .eq('user_id', userId)
      .single();

    let result;

    if (existingPricing) {
      // Update existing pricing
      console.log('🔄 Updating existing pricing');
      const { data: updatedPricing, error } = await supabaseAdmin
        .from('user_pricing')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating pricing:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to update pricing'
        });
      }

      result = updatedPricing;
    } else {
      // Create new pricing with provided values and defaults
      console.log('🆕 Creating new pricing with partial data');
      const newPricingData = {
        user_id: userId,
        sms_cost: sms_cost !== undefined ? parseFloat(sms_cost) : 10.00,
        audio_call_cost: audio_call_cost !== undefined ? parseFloat(audio_call_cost) : 25.00,
        video_call_cost: video_call_cost !== undefined ? parseFloat(video_call_cost) : 50.00,
        is_active: true
      };

      const { data: newPricing, error } = await supabaseAdmin
        .from('user_pricing')
        .insert(newPricingData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating pricing:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create pricing'
        });
      }

      result = newPricing;
    }

    console.log('✅ Pricing updated successfully for user:', userId);

    res.json({
      success: true,
      pricing: result,
      message: 'Pricing updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating user pricing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete user's pricing (set to inactive)
router.delete('/my-pricing', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('🗑️ Deleting pricing for user:', userId);

    const { error } = await supabaseAdmin
      .from('user_pricing')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting pricing:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete pricing'
      });
    }

    console.log('✅ Pricing deleted successfully for user:', userId);

    res.json({
      success: true,
      message: 'Pricing deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error deleting user pricing:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get pricing statistics (for user dashboard)
router.get('/pricing-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('📊 Fetching pricing stats for user:', userId);

    // Get user's pricing
    const { data: pricing } = await supabaseAdmin
      .from('user_pricing')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // Get average pricing in the market (optional)
    const { data: marketPricing } = await supabaseAdmin
      .from('user_pricing')
      .select('sms_cost, audio_call_cost, video_call_cost')
      .eq('is_active', true)
      .neq('user_id', userId);

    let marketAverages = {
      sms_cost: 0,
      audio_call_cost: 0,
      video_call_cost: 0
    };

    if (marketPricing && marketPricing.length > 0) {
      const totalSms = marketPricing.reduce((sum, p) => sum + parseFloat(p.sms_cost), 0);
      const totalAudio = marketPricing.reduce((sum, p) => sum + parseFloat(p.audio_call_cost), 0);
      const totalVideo = marketPricing.reduce((sum, p) => sum + parseFloat(p.video_call_cost), 0);
      
      marketAverages = {
        sms_cost: Math.round((totalSms / marketPricing.length) * 100) / 100,
        audio_call_cost: Math.round((totalAudio / marketPricing.length) * 100) / 100,
        video_call_cost: Math.round((totalVideo / marketPricing.length) * 100) / 100
      };
    }

    res.json({
      success: true,
      myPricing: pricing || null,
      marketAverages: marketAverages,
      hasPricing: !!pricing,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching pricing stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get pricing history (optional feature)
router.get('/pricing-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    console.log('📜 Fetching pricing history for user:', userId);

    const { data: history, error } = await supabaseAdmin
      .from('pricing_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching pricing history:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pricing history'
      });
    }

    res.json({
      success: true,
      history: history || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching pricing history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
