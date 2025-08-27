const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

class UserService {
  constructor() {
    this.userCache = new Map(); // Cache user data for quick access
  }

  // Create or update user after OTP verification
  async createOrUpdateUser(phoneNumber, userData = {}) {
    try {
      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error('Failed to check existing user');
      }

      const now = new Date();
      let user;

      if (existingUser) {
        // Update existing user
        const updateData = {
          ...userData,
          is_verified: true,
          verification_status: 'verified',
          verification_date: now,
          last_login_at: now,
          login_count: existingUser.login_count + 1,
          updated_at: now
        };

        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('phone_number', phoneNumber)
          .select()
          .single();

        if (updateError) {
          throw new Error('Failed to update user');
        }

        user = updatedUser;
      } else {
        // Create new user
        const newUserData = {
          id: uuidv4(),
          phone_number: phoneNumber,
          is_verified: true,
          verification_status: 'verified',
          verification_date: now,
          last_login_at: now,
          login_count: 1,
          ...userData
        };

        const { data: newUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert(newUserData)
          .select()
          .single();

        if (insertError) {
          throw new Error('Failed to create user');
        }

        user = newUser;

        // Create default user preferences
        await this.createDefaultPreferences(user.id);
      }

      // Cache user data
      this.userCache.set(user.id, user);

      return {
        success: true,
        user: user
      };

    } catch (error) {
      console.error('Error creating/updating user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create default user preferences
  async createDefaultPreferences(userId) {
    try {
      const { error: prefError } = await supabaseAdmin
        .from('user_preferences')
        .insert({
          user_id: userId,
          push_notifications: true,
          email_notifications: true,
          sms_notifications: false,
          privacy_level: 'public',
          show_online_status: true,
          show_last_seen: true,
          allow_profile_views: true
        });

      if (prefError) {
        console.error('Error creating default preferences:', prefError);
      }
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      console.log('🔍 getUserById called with userId:', userId);
      
      // Check cache first
      if (this.userCache.has(userId)) {
        console.log('✅ User found in cache');
        const cachedUser = this.userCache.get(userId);
        return {
          success: true,
          user: cachedUser
        };
      }

      console.log('🔍 Querying database for user:', userId);
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('❌ Database error:', error);
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (!user) {
        console.log('❌ No user found in database');
        return {
          success: false,
          error: 'User not found'
        };
      }

      console.log('✅ User found in database:', user.id);
      // Cache the user
      this.userCache.set(userId, user);
      
      return {
        success: true,
        user: user
      };

    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user by phone number
  async getUserByPhone(phoneNumber) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (error) {
        return null;
      }

      return user;

    } catch (error) {
      console.error('Error getting user by phone:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(userId, profileData) {
    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update profile');
      }

      // Update cache
      this.userCache.set(userId, updatedUser);

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Log user activity
  async logActivity(userId, activityType, details = {}, ipAddress = null, userAgent = null) {
    try {
      const { error } = await supabaseAdmin
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          details: details,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      const { data: connections, error: connError } = await supabaseAdmin
        .from('user_connections')
        .select('*')
        .eq('user_id', userId);

      const { data: photos, error: photoError } = await supabaseAdmin
        .from('user_photos')
        .select('*')
        .eq('user_id', userId);

      const { data: activities, error: activityError } = await supabaseAdmin
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      return {
        success: true,
        stats: {
          totalConnections: connections?.length || 0,
          totalPhotos: photos?.length || 0,
          recentActivities: activities?.length || 0,
          profileCompletion: user.profile_completion_percentage || 0,
          loginCount: user.login_count || 0,
          lastLogin: user.last_login_at,
          isVerified: user.is_verified,
          verificationStatus: user.verification_status
        }
      };

    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search users
  async searchUsers(query, limit = 20) {
    try {
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, name, phone_number, bio, location, profile_completion_percentage, is_verified, created_at')
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%,location.ilike.%${query}%`)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Failed to search users');
      }

      return {
        success: true,
        users: users || []
      };

    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        error: error.message,
        users: []
      };
    }
  }

  // Update user preferences
  async updateUserPreferences(userId, preferencesData) {
    try {
      // Check if preferences exist
      const { data: existingPrefs, error: fetchError } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      let result;
      if (existingPrefs) {
        // Update existing preferences
        const { data: updatedPrefs, error } = await supabaseAdmin
          .from('user_preferences')
          .update({
            ...preferencesData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          throw new Error('Failed to update preferences');
        }

        result = updatedPrefs;
      } else {
        // Create new preferences
        const { data: newPrefs, error } = await supabaseAdmin
          .from('user_preferences')
          .insert({
            user_id: userId,
            ...preferencesData
          })
          .select()
          .single();

        if (error) {
          throw new Error('Failed to create preferences');
        }

        result = newPrefs;
      }

      return {
        success: true,
        preferences: result
      };

    } catch (error) {
      console.error('Error updating user preferences:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add user interests
  async addUserInterests(userId, interests) {
    try {
      const interestsToInsert = interests.map(interest => ({
        user_id: userId,
        interest_name: interest.name,
        interest_category: interest.category || 'General'
      }));

      const { data: insertedInterests, error } = await supabaseAdmin
        .from('user_interests')
        .insert(interestsToInsert)
        .select();

      if (error) {
        throw new Error('Failed to add interests');
      }

      return {
        success: true,
        interests: insertedInterests
      };

    } catch (error) {
      console.error('Error adding user interests:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add user photos
  async addUserPhotos(userId, photos) {
    try {
      const photosToInsert = photos.map((photo, index) => ({
        user_id: userId,
        photo_url: photo.url,
        is_primary: photo.is_primary || false,
        photo_order: index + 1
      }));

      const { data: insertedPhotos, error } = await supabaseAdmin
        .from('user_photos')
        .insert(photosToInsert)
        .select();

      if (error) {
        throw new Error('Failed to add photos');
      }

      return {
        success: true,
        photos: insertedPhotos
      };

    } catch (error) {
      console.error('Error adding user photos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update user status
  async updateUserStatus(userId, status) {
    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update status');
      }

      // Update cache
      this.userCache.set(userId, updatedUser);

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      console.error('Error updating user status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear user cache
  clearCache() {
    this.userCache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.userCache.size;
  }
}

module.exports = new UserService();
