# Flutter Integration Guide - Complete Login Flow

## Overview

This guide shows how to integrate the complete login flow in your Flutter app, including OTP verification, smart user detection, and profile management.

## 🚀 Complete Login Flow

### 1. Send OTP
### 2. Verify OTP (Smart Detection)
### 3. Handle New vs Returning Users
### 4. Fetch Profile Data
### 5. Display in ProfileCardWidget

---

## 📱 Flutter Implementation

### Step 1: API Service Class

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthApiService {
  static const String baseUrl = 'http://localhost:5000/api/auth';

  // Send OTP
  static Future<bool> sendOTP(String phoneNumber) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'phoneNumber': phoneNumber}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] ?? false;
      }
      return false;
    } catch (e) {
      print('Error sending OTP: $e');
      return false;
    }
  }

  // Verify OTP and get login response
  static Future<Map<String, dynamic>?> verifyOTP(String phoneNumber, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'phoneNumber': phoneNumber,
          'otp': otp,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error verifying OTP: $e');
      return null;
    }
  }

  // Fetch user profile
  static Future<Map<String, dynamic>?> fetchProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error fetching profile: $e');
      return null;
    }
  }

  // Update user profile
  static Future<Map<String, dynamic>?> updateProfile(
    String token, 
    Map<String, dynamic> profileData
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode(profileData),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error updating profile: $e');
      return null;
    }
  }

  // Create profile (for new users)
  static Future<Map<String, dynamic>?> createProfile(
    String token, 
    Map<String, dynamic> profileData
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/create-profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode(profileData),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return null;
    } catch (e) {
      print('Error creating profile: $e');
      return null;
    }
  }
}
```

### Step 2: User Profile Model

```dart
class UserProfileModel {
  final String id;
  final String phoneNumber;
  final String fullName;
  final String email;
  final int? age;
  final String gender;
  final String location;
  final String bio;
  final String image;
  final String avatarUrl;
  final List<PhotoModel> photos;
  final bool online;
  final String lastSeen;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? lastLoginAt;
  final int loginCount;
  final bool isVerified;
  final String verificationStatus;
  final bool isActive;
  final bool isPremium;
  final int profileCompletionPercentage;
  final List<String> interests;
  final UserPreferencesModel preferences;

  UserProfileModel({
    required this.id,
    required this.phoneNumber,
    required this.fullName,
    required this.email,
    this.age,
    required this.gender,
    required this.location,
    required this.bio,
    required this.image,
    required this.avatarUrl,
    required this.photos,
    required this.online,
    required this.lastSeen,
    required this.createdAt,
    required this.updatedAt,
    this.lastLoginAt,
    required this.loginCount,
    required this.isVerified,
    required this.verificationStatus,
    required this.isActive,
    required this.isPremium,
    required this.profileCompletionPercentage,
    required this.interests,
    required this.preferences,
  });

  factory UserProfileModel.fromJson(Map<String, dynamic> json) {
    return UserProfileModel(
      id: json['id'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      fullName: json['fullName'] ?? '',
      email: json['email'] ?? '',
      age: json['age'],
      gender: json['gender'] ?? '',
      location: json['location'] ?? '',
      bio: json['bio'] ?? '',
      image: json['image'] ?? '',
      avatarUrl: json['avatarUrl'] ?? '',
      photos: (json['photos'] as List<dynamic>?)
          ?.map((photo) => PhotoModel.fromJson(photo))
          .toList() ?? [],
      online: json['online'] ?? false,
      lastSeen: json['lastSeen'] ?? '',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      lastLoginAt: json['lastLoginAt'] != null 
          ? DateTime.parse(json['lastLoginAt']) 
          : null,
      loginCount: json['loginCount'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      verificationStatus: json['verificationStatus'] ?? '',
      isActive: json['isActive'] ?? true,
      isPremium: json['isPremium'] ?? false,
      profileCompletionPercentage: json['profileCompletionPercentage'] ?? 0,
      interests: List<String>.from(json['interests'] ?? []),
      preferences: UserPreferencesModel.fromJson(json['preferences'] ?? {}),
    );
  }
}

class PhotoModel {
  final String id;
  final String url;
  final bool isPrimary;
  final int order;

  PhotoModel({
    required this.id,
    required this.url,
    required this.isPrimary,
    required this.order,
  });

  factory PhotoModel.fromJson(Map<String, dynamic> json) {
    return PhotoModel(
      id: json['id'] ?? '',
      url: json['url'] ?? '',
      isPrimary: json['isPrimary'] ?? false,
      order: json['order'] ?? 0,
    );
  }
}

class UserPreferencesModel {
  final bool pushNotifications;
  final bool emailNotifications;
  final bool smsNotifications;
  final String privacyLevel;
  final bool showOnlineStatus;
  final bool showLastSeen;
  final bool allowProfileViews;

  UserPreferencesModel({
    required this.pushNotifications,
    required this.emailNotifications,
    required this.smsNotifications,
    required this.privacyLevel,
    required this.showOnlineStatus,
    required this.showLastSeen,
    required this.allowProfileViews,
  });

  factory UserPreferencesModel.fromJson(Map<String, dynamic> json) {
    return UserPreferencesModel(
      pushNotifications: json['pushNotifications'] ?? true,
      emailNotifications: json['emailNotifications'] ?? true,
      smsNotifications: json['smsNotifications'] ?? false,
      privacyLevel: json['privacyLevel'] ?? 'public',
      showOnlineStatus: json['showOnlineStatus'] ?? true,
      showLastSeen: json['showLastSeen'] ?? true,
      allowProfileViews: json['allowProfileViews'] ?? true,
    );
  }
}
```

### Step 3: Login Screen Implementation

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  bool _isLoading = false;
  bool _otpSent = false;
  String? _jwtToken;
  UserProfileModel? _userProfile;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Phone Number Input
            TextField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: 'Phone Number',
                hintText: '+916204691688',
              ),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 16),

            // Send OTP Button
            if (!_otpSent)
              ElevatedButton(
                onPressed: _isLoading ? null : _sendOTP,
                child: Text('Send OTP'),
              ),

            // OTP Input (show after OTP sent)
            if (_otpSent) ...[
              TextField(
                controller: _otpController,
                decoration: InputDecoration(
                  labelText: 'OTP',
                  hintText: '123456',
                ),
                keyboardType: TextInputType.number,
              ),
              SizedBox(height: 16),

              // Verify OTP Button
              ElevatedButton(
                onPressed: _isLoading ? null : _verifyOTP,
                child: Text('Verify OTP'),
              ),
            ],

            // Loading Indicator
            if (_isLoading)
              CircularProgressIndicator(),

            // Profile Display (after successful login)
            if (_userProfile != null) ...[
              SizedBox(height: 32),
              ProfileCardWidget(userProfile: _userProfile!),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _sendOTP() async {
    setState(() => _isLoading = true);

    final success = await AuthApiService.sendOTP(_phoneController.text);

    setState(() {
      _isLoading = false;
      if (success) {
        _otpSent = true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('OTP sent successfully!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send OTP')),
        );
      }
    });
  }

  Future<void> _verifyOTP() async {
    setState(() => _isLoading = true);

    final loginResponse = await AuthApiService.verifyOTP(
      _phoneController.text,
      _otpController.text,
    );

    if (loginResponse != null) {
      final token = loginResponse['token'];
      final isNewUser = loginResponse['isNewUser'] ?? false;
      final hasCompleteProfile = loginResponse['hasCompleteProfile'] ?? false;
      final redirectTo = loginResponse['redirectTo'];

      setState(() {
        _jwtToken = token;
        _isLoading = false;
      });

      // Handle new vs returning user
      if (isNewUser && !hasCompleteProfile) {
        // Show profile completion screen
        _showProfileCompletion(token);
      } else {
        // Fetch and display profile
        _fetchAndDisplayProfile(token);
      }

      // Show login success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isNewUser 
              ? 'Welcome! Please complete your profile.' 
              : 'Welcome back!'
          ),
        ),
      );
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Invalid OTP')),
      );
    }
  }

  Future<void> _fetchAndDisplayProfile(String token) async {
    final profileResponse = await AuthApiService.fetchProfile(token);

    if (profileResponse != null) {
      final profileData = profileResponse['profile'];
      final userProfile = UserProfileModel.fromJson(profileData);

      setState(() {
        _userProfile = userProfile;
      });
    }
  }

  void _showProfileCompletion(String token) {
    // Navigate to profile completion screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileCompletionScreen(token: token),
      ),
    );
  }
}
```

### Step 4: Profile Completion Screen

```dart
class ProfileCompletionScreen extends StatefulWidget {
  final String token;

  ProfileCompletionScreen({required this.token});

  @override
  _ProfileCompletionScreenState createState() => _ProfileCompletionScreenState();
}

class _ProfileCompletionScreenState extends State<ProfileCompletionScreen> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  String _selectedGender = 'male';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Complete Profile')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: 'Full Name'),
            ),
            SizedBox(height: 16),

            TextField(
              controller: _ageController,
              decoration: InputDecoration(labelText: 'Age'),
              keyboardType: TextInputType.number,
            ),
            SizedBox(height: 16),

            DropdownButtonFormField<String>(
              value: _selectedGender,
              decoration: InputDecoration(labelText: 'Gender'),
              items: ['male', 'female', 'other', 'prefer_not_to_say']
                  .map((gender) => DropdownMenuItem(
                        value: gender,
                        child: Text(gender),
                      ))
                  .toList(),
              onChanged: (value) {
                setState(() => _selectedGender = value!);
              },
            ),
            SizedBox(height: 32),

            ElevatedButton(
              onPressed: _isLoading ? null : _createProfile,
              child: Text('Complete Profile'),
            ),

            if (_isLoading) CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }

  Future<void> _createProfile() async {
    setState(() => _isLoading = true);

    final profileData = {
      'name': _nameController.text,
      'age': int.parse(_ageController.text),
      'gender': _selectedGender,
    };

    final response = await AuthApiService.createProfile(widget.token, profileData);

    setState(() => _isLoading = false);

    if (response != null) {
      // Navigate to main app
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => MainAppScreen(token: widget.token),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to create profile')),
      );
    }
  }
}
```

### Step 5: Main App Screen with Profile

```dart
class MainAppScreen extends StatefulWidget {
  final String token;

  MainAppScreen({required this.token});

  @override
  _MainAppScreenState createState() => _MainAppScreenState();
}

class _MainAppScreenState extends State<MainAppScreen> {
  UserProfileModel? _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profileResponse = await AuthApiService.fetchProfile(widget.token);

    if (profileResponse != null) {
      final profileData = profileResponse['profile'];
      final userProfile = UserProfileModel.fromJson(profileData);

      setState(() {
        _userProfile = userProfile;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_userProfile == null) {
      return Scaffold(
        body: Center(child: Text('Failed to load profile')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome ${_userProfile!.fullName}'),
        actions: [
          IconButton(
            icon: Icon(Icons.edit),
            onPressed: () => _showEditProfile(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Profile Card
            ProfileCardWidget(userProfile: _userProfile!),
            
            SizedBox(height: 24),
            
            // Profile Stats
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Profile Statistics',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 16),
                    _buildStatRow('Login Count', '${_userProfile!.loginCount}'),
                    _buildStatRow('Profile Completion', '${_userProfile!.profileCompletionPercentage}%'),
                    _buildStatRow('Member Since', _formatDate(_userProfile!.createdAt)),
                    _buildStatRow('Last Login', _formatDate(_userProfile!.lastLoginAt)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'Never';
    return '${date.day}/${date.month}/${date.year}';
  }

  void _showEditProfile() {
    // Navigate to edit profile screen
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditProfileScreen(
          token: widget.token,
          userProfile: _userProfile!,
        ),
      ),
    );
  }
}
```

---

## 🎯 Key Features Implemented

### ✅ Smart Login Flow
- **New Users**: OTP → Profile Creation → Dashboard
- **Returning Users**: OTP → Direct to Dashboard

### ✅ Complete Profile Management
- Fetch profile data with JWT token
- Update profile information
- Profile completion tracking

### ✅ Frontend Integration
- ProfileCardWidget compatible data
- Real-time profile updates
- Error handling and loading states

### ✅ Security Features
- JWT token authentication
- Secure API communication
- Input validation

---

## 🚀 Testing

Run the complete test flow:

```bash
node test-complete-login-flow.js
```

This will test:
1. First-time user login
2. Profile creation
3. Second login (returning user)
4. Profile updates
5. Data fetching

---

## 📱 Next Steps

1. **Copy the code** to your Flutter project
2. **Update the base URL** to your server address
3. **Test the complete flow** with the test script
4. **Customize the UI** as needed
5. **Add error handling** for production use

Your Flutter app is now ready to handle the complete login flow! 🎉
