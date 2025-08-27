/**
 * User Model Class - Based on Supabase Database Schema
 * 
 * This class represents the complete user data structure from your Supabase database.
 * It includes all tables: users, user_preferences, user_interests, user_photos, etc.
 */

class UserModel {
  constructor(data = {}) {
    // ========================================
    // MAIN USER TABLE FIELDS
    // ========================================
    
    // Basic Information
    this.id = data.id || null;                                    // UUID - Primary Key
    this.phoneNumber = data.phone_number || null;                 // VARCHAR(20) - Unique, Required
    this.name = data.name || null;                                // VARCHAR(100)
    this.email = data.email || null;                              // VARCHAR(255) - Unique
    this.avatarUrl = data.avatar_url || null;                     // TEXT
    this.bio = data.bio || null;                                  // TEXT
    this.age = data.age || null;                                 // INTEGER
    this.gender = data.gender || null;                            // VARCHAR(20) - male, female, other, prefer_not_to_say
    this.location = data.location || null;                        // VARCHAR(255)
    
    // Status & Activity
    this.status = data.status || 'online';                       // VARCHAR(50) - Default: 'online'
    this.lastSeen = data.last_seen || null;                      // TIMESTAMP WITH TIME ZONE
    this.createdAt = data.created_at || null;                    // TIMESTAMP WITH TIME ZONE
    this.updatedAt = data.updated_at || null;                    // TIMESTAMP WITH TIME ZONE
    this.lastLoginAt = data.last_login_at || null;               // TIMESTAMP WITH TIME ZONE
    this.loginCount = data.login_count || 0;                     // INTEGER - Default: 0
    
    // Verification & Status
    this.isVerified = data.is_verified || false;                 // BOOLEAN - Default: FALSE
    this.isActive = data.is_active || true;                      // BOOLEAN - Default: TRUE
    this.isPremium = data.is_premium || false;                   // BOOLEAN - Default: FALSE
    this.verificationStatus = data.verification_status || 'pending'; // VARCHAR(20) - pending, verified, blocked
    this.verificationDate = data.verification_date || null;      // TIMESTAMP WITH TIME ZONE
    this.profileCompletionPercentage = data.profile_completion_percentage || 0; // INTEGER 0-100
    
    // Device & Network
    this.deviceId = data.device_id || null;                      // VARCHAR(255)
    this.ipAddress = data.ip_address || null;                    // INET
    
    // ========================================
    // RELATED DATA (from other tables)
    // ========================================
    
    // User Preferences
    this.preferences = data.preferences || {
      pushNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      privacyLevel: 'public',
      showOnlineStatus: true,
      showLastSeen: true,
      allowProfileViews: true
    };
    
    // User Interests
    this.interests = data.interests || [];
    
    // User Photos
    this.photos = data.photos || [];
    
    // User Documents (for verification)
    this.documents = data.documents || [];
    
    // User Connections/Friends
    this.connections = data.connections || [];
    
    // User Activity Logs
    this.activityLogs = data.activity_logs || [];
    
    // User Sessions
    this.sessions = data.sessions || [];
  }

  // ========================================
  // VALIDATION METHODS
  // ========================================
  
  isValid() {
    return this.phoneNumber && this.phoneNumber.length > 0;
  }
  
  isProfileComplete() {
    return this.profileCompletionPercentage >= 80;
  }
  
  isVerified() {
    return this.isVerified && this.verificationStatus === 'verified';
  }
  
  isOnline() {
    return this.status === 'online';
  }
  
  // ========================================
  // CALCULATED PROPERTIES
  // ========================================
  
  get age() {
    if (!this.dateOfBirth) return null;
    const birthDate = new Date(this.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  get primaryPhoto() {
    return this.photos.find(photo => photo.isPrimary) || this.photos[0] || null;
  }
  
  get displayName() {
    return this.name || 'Anonymous';
  }
  
  get formattedLastSeen() {
    if (!this.lastSeen) return 'Never';
    
    const lastSeenDate = new Date(this.lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // ========================================
  // DATA TRANSFORMATION METHODS
  // ========================================
  
  toJSON() {
    return {
      // Basic Info
      id: this.id,
      phoneNumber: this.phoneNumber,
      name: this.name,
      email: this.email,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      location: this.location,
      
      // Calculated Fields
      age: this.age,
      displayName: this.displayName,
      primaryPhoto: this.primaryPhoto,
      formattedLastSeen: this.formattedLastSeen,
      
      // Status & Activity
      status: this.status,
      lastSeen: this.lastSeen,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      loginCount: this.loginCount,
      
      // Verification & Status
      isVerified: this.isVerified,
      isActive: this.isActive,
      isPremium: this.isPremium,
      verificationStatus: this.verificationStatus,
      verificationDate: this.verificationDate,
      profileCompletionPercentage: this.profileCompletionPercentage,
      
      // Device & Network
      deviceId: this.deviceId,
      ipAddress: this.ipAddress,
      
      // Related Data
      preferences: this.preferences,
      interests: this.interests,
      photos: this.photos,
      documents: this.documents,
      connections: this.connections,
      activityLogs: this.activityLogs,
      sessions: this.sessions,
      
      // Validation Methods
      isValid: this.isValid(),
      isProfileComplete: this.isProfileComplete(),
      isVerified: this.isVerified(),
      isOnline: this.isOnline()
    };
  }
  
  toProfileCardFormat() {
    return {
      id: this.id,
      phoneNumber: this.phoneNumber,
      fullName: this.displayName,
      email: this.email || '',
      age: this.age,
      gender: this.gender || '',
      location: this.location || '',
      bio: this.bio || '',
      
      // Profile Images
      image: this.primaryPhoto?.url || '',
      avatarUrl: this.avatarUrl || this.primaryPhoto?.url || '',
      photos: this.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        isPrimary: photo.isPrimary,
        order: photo.order
      })),
      
      // Status & Activity
      online: this.isOnline(),
      lastSeen: this.formattedLastSeen,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      loginCount: this.loginCount,
      
      // Verification & Status
      isVerified: this.isVerified(),
      verificationStatus: this.verificationStatus,
      isActive: this.isActive,
      isPremium: this.isPremium,
      profileCompletionPercentage: this.profileCompletionPercentage,
      
      // Interests
      interests: this.interests.map(interest => interest.name),
      
      // Preferences
      preferences: this.preferences
    };
  }
  
  // ========================================
  // STATIC METHODS FOR CREATION
  // ========================================
  
  static fromDatabaseRow(row) {
    return new UserModel(row);
  }
  
  static fromProfileCardData(data) {
    return new UserModel({
      id: data.id,
      phone_number: data.phoneNumber,
      name: data.fullName,
      email: data.email,
      avatar_url: data.avatarUrl,
      bio: data.bio,
      gender: data.gender,
      location: data.location,
      // Map other fields as needed
    });
  }
  
  // ========================================
  // UPDATE METHODS
  // ========================================
  
  updateProfile(profileData) {
    if (profileData.name) this.name = profileData.name;
    if (profileData.email) this.email = profileData.email;
    if (profileData.bio) this.bio = profileData.bio;
    if (profileData.location) this.location = profileData.location;
    if (profileData.gender) this.gender = profileData.gender;
    if (profileData.dateOfBirth) this.dateOfBirth = profileData.dateOfBirth;
    if (profileData.avatarUrl) this.avatarUrl = profileData.avatarUrl;
    
    this.updatedAt = new Date().toISOString();
    return this;
  }
  
  updatePreferences(preferencesData) {
    this.preferences = { ...this.preferences, ...preferencesData };
    return this;
  }
  
  addInterest(interest) {
    this.interests.push(interest);
    return this;
  }
  
  addPhoto(photo) {
    this.photos.push(photo);
    return this;
  }
  
  setPrimaryPhoto(photoId) {
    this.photos.forEach(photo => {
      photo.isPrimary = photo.id === photoId;
    });
    return this;
  }
  
  // ========================================
  // VALIDATION SCHEMAS
  // ========================================
  
  static getValidationSchema() {
    return {
      phoneNumber: {
        required: true,
        type: 'string',
        pattern: /^\+[1-9]\d{1,14}$/,
        maxLength: 20
      },
      name: {
        required: false,
        type: 'string',
        maxLength: 100
      },
      email: {
        required: false,
        type: 'email',
        maxLength: 255
      },
      gender: {
        required: false,
        type: 'enum',
        values: ['male', 'female', 'other', 'prefer_not_to_say']
      },
      location: {
        required: false,
        type: 'string',
        maxLength: 255
      },
      bio: {
        required: false,
        type: 'string',
        maxLength: 500
      }
    };
  }
}

// ========================================
// RELATED MODEL CLASSES
// ========================================

class UserPreference {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.pushNotifications = data.push_notifications || true;
    this.emailNotifications = data.email_notifications || true;
    this.smsNotifications = data.sms_notifications || false;
    this.privacyLevel = data.privacy_level || 'public';
    this.showOnlineStatus = data.show_online_status || true;
    this.showLastSeen = data.show_last_seen || true;
    this.allowProfileViews = data.allow_profile_views || true;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }
}

class UserInterest {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.name = data.interest_name || '';
    this.category = data.interest_category || null;
    this.createdAt = data.created_at || null;
  }
}

class UserPhoto {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.url = data.photo_url || '';
    this.order = data.photo_order || 0;
    this.isPrimary = data.is_primary || false;
    this.isApproved = data.is_approved || true;
    this.createdAt = data.created_at || null;
  }
}

class UserDocument {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.type = data.document_type || '';
    this.url = data.document_url || '';
    this.verificationStatus = data.verification_status || 'pending';
    this.verifiedAt = data.verified_at || null;
    this.verifiedBy = data.verified_by || null;
    this.rejectionReason = data.rejection_reason || null;
    this.createdAt = data.created_at || null;
  }
}

class UserConnection {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.connectedUserId = data.connected_user_id || null;
    this.type = data.connection_type || 'friend';
    this.status = data.connection_status || 'active';
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }
}

class UserActivityLog {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.type = data.activity_type || '';
    this.details = data.activity_details || {};
    this.ipAddress = data.ip_address || null;
    this.userAgent = data.user_agent || null;
    this.createdAt = data.created_at || null;
  }
}

class UserSession {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || null;
    this.sessionId = data.session_id || '';
    this.socketId = data.socket_id || null;
    this.connectionType = data.connection_type || 'web';
    this.deviceInfo = data.device_info || {};
    this.lastHeartbeat = data.last_heartbeat || null;
    this.expiresAt = data.expires_at || null;
    this.createdAt = data.created_at || null;
  }
}

// Export all classes
module.exports = {
  UserModel,
  UserPreference,
  UserInterest,
  UserPhoto,
  UserDocument,
  UserConnection,
  UserActivityLog,
  UserSession
};
