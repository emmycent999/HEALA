# HEALA Flutter Mobile App Migration Guide

This comprehensive guide provides step-by-step instructions for creating Android and iOS mobile applications for HEALA using Flutter, while maintaining integration with the existing Supabase backend.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Setup](#project-setup)
4. [Backend Integration](#backend-integration)
5. [Database Integration](#database-integration)
6. [Architecture](#architecture)
7. [Implementation Guides](#implementation-guides)
8. [Deployment](#deployment)

---

## Overview

HEALA is a comprehensive healthcare platform that connects patients, physicians, hospitals, agents, and administrators. This guide will help you create native mobile applications for Android and iOS using Flutter while leveraging the existing Supabase backend infrastructure.

### Key Features to Implement

- **Patient Features**: Appointments, Virtual Consultations, Wallet Management, Emergency Services, Health Records
- **Physician Features**: Patient Management, Appointment Approval, Prescriptions, Virtual Consultations
- **Hospital Admin Features**: Patient Management, Resource Management, Staff Scheduling, Analytics
- **Agent Features**: Patient Assistance, Appointment Booking
- **Admin Features**: User Management, System Monitoring, Compliance Reports

---

## Prerequisites

### Required Tools

1. **Flutter SDK** (Latest stable version - 3.x or higher)
   ```bash
   flutter --version
   ```

2. **Android Studio** (for Android development)
   - Android SDK
   - Android Emulator or physical device

3. **Xcode** (for iOS development - macOS only)
   - iOS Simulator or physical device
   - Apple Developer Account (for deployment)

4. **VS Code or Android Studio** (IDE with Flutter plugins)

5. **Git** (version control)

### Required Accounts

- Supabase account (already configured)
- Google Cloud Console (for Firebase - optional for push notifications)
- Apple Developer Account (for iOS deployment)
- Google Play Console (for Android deployment)
- Paystack Account (payment integration)

---

## Project Setup

### 1. Create Flutter Project

```bash
# Create new Flutter project
flutter create heala_mobile

# Navigate to project directory
cd heala_mobile

# Verify Flutter setup
flutter doctor
```

### 2. Project Structure

```
heala_mobile/
├── android/                 # Android-specific code
├── ios/                     # iOS-specific code
├── lib/
│   ├── main.dart           # App entry point
│   ├── core/
│   │   ├── constants/      # App constants
│   │   ├── theme/          # App theme
│   │   └── utils/          # Utility functions
│   ├── data/
│   │   ├── models/         # Data models
│   │   ├── repositories/   # Data repositories
│   │   └── services/       # API services
│   ├── presentation/
│   │   ├── screens/        # App screens
│   │   ├── widgets/        # Reusable widgets
│   │   └── providers/      # State management
│   └── config/
│       └── routes.dart     # App routing
├── assets/                 # Images, fonts, etc.
└── pubspec.yaml           # Dependencies
```

### 3. Essential Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Supabase
  supabase_flutter: ^2.0.0
  
  # State Management
  flutter_riverpod: ^2.4.0
  
  # Routing
  go_router: ^12.0.0
  
  # UI Components
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  
  # HTTP & Networking
  dio: ^5.4.0
  connectivity_plus: ^5.0.2
  
  # Local Storage
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Forms & Validation
  flutter_form_builder: ^9.1.1
  form_builder_validators: ^9.1.0
  
  # Date & Time
  intl: ^0.18.1
  
  # Media
  image_picker: ^1.0.5
  file_picker: ^6.1.1
  
  # WebRTC for Video Calls
  flutter_webrtc: ^0.9.48
  
  # Payments
  flutter_paystack: ^1.0.7
  
  # Maps & Location
  google_maps_flutter: ^2.5.0
  geolocator: ^10.1.0
  geocoding: ^2.1.1
  
  # Push Notifications
  firebase_messaging: ^14.7.6
  firebase_core: ^2.24.0
  flutter_local_notifications: ^16.3.0
  
  # Permissions
  permission_handler: ^11.1.0
  
  # Utils
  uuid: ^4.2.1
  url_launcher: ^6.2.2
  share_plus: ^7.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.1
  hive_generator: ^2.0.1
  build_runner: ^2.4.7
```

### 4. Install Dependencies

```bash
flutter pub get
```

---

## Backend Integration

### 1. Supabase Configuration

Create `lib/core/config/supabase_config.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  static const String supabaseUrl = 'https://hzznoxctqybcberrkgjt.supabase.co';
  static const String supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5veGN0cXliY2JlcnJrZ2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzc2OTMsImV4cCI6MjA2MzY1MzY5M30.CRpYAbPa00yuEsSYtzIDujX1xcCpJAOk2VYtxh9msJ0';
  
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
    );
  }
  
  static SupabaseClient get client => Supabase.instance.client;
}
```

### 2. Initialize in main.dart

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/supabase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseConfig.initialize();
  
  runApp(
    const ProviderScope(
      child: HealaApp(),
    ),
  );
}

class HealaApp extends StatelessWidget {
  const HealaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HEALA',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}
```

### 3. Authentication Service

Create `lib/data/services/auth_service.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/config/supabase_config.dart';

class AuthService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  
  // Get current user
  User? get currentUser => _supabase.auth.currentUser;
  
  // Sign up
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required Map<String, dynamic> userData,
  }) async {
    return await _supabase.auth.signUp(
      email: email,
      password: password,
      data: userData,
    );
  }
  
  // Sign in
  Future<AuthResponse> signIn({
    required String email,
    required String password,
  }) async {
    return await _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }
  
  // Sign out
  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }
  
  // Reset password
  Future<void> resetPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }
  
  // Auth state changes stream
  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;
}
```

---

## Database Integration

### 1. Data Models

Create models that match your Supabase tables. Example for profiles:

`lib/data/models/user_profile.dart`:

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_profile.freezed.dart';
part 'user_profile.g.dart';

@freezed
class UserProfile with _$UserProfile {
  const factory UserProfile({
    required String id,
    required String email,
    String? firstName,
    String? lastName,
    String? phone,
    required String role,
    String? specialization,
    String? licenseNumber,
    String? hospitalId,
    @Default('basic') String subscriptionPlan,
    @Default(true) bool isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _UserProfile;

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);
}
```

### 2. Repository Pattern

`lib/data/repositories/user_repository.dart`:

```dart
import '../models/user_profile.dart';
import '../services/supabase_service.dart';

class UserRepository {
  final SupabaseService _supabaseService;
  
  UserRepository(this._supabaseService);
  
  Future<UserProfile?> getUserProfile(String userId) async {
    try {
      final response = await _supabaseService.client
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();
      
      return UserProfile.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch user profile: $e');
    }
  }
  
  Future<void> updateUserProfile(String userId, Map<String, dynamic> updates) async {
    try {
      await _supabaseService.client
          .from('profiles')
          .update(updates)
          .eq('id', userId);
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }
}
```

### 3. Real-time Subscriptions

`lib/data/services/realtime_service.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/config/supabase_config.dart';

class RealtimeService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  
  // Listen to appointments changes
  RealtimeChannel subscribeToAppointments(
    String userId,
    Function(Map<String, dynamic>) onUpdate,
  ) {
    return _supabase
        .channel('appointments_$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'patient_id',
            value: userId,
          ),
          callback: (payload) {
            onUpdate(payload.newRecord);
          },
        )
        .subscribe();
  }
  
  // Unsubscribe from channel
  Future<void> unsubscribe(RealtimeChannel channel) async {
    await _supabase.removeChannel(channel);
  }
}
```

---

## Architecture

### Clean Architecture Pattern

```
Presentation Layer (UI)
    ↓
State Management (Riverpod)
    ↓
Use Cases / Business Logic
    ↓
Repository Layer
    ↓
Data Sources (Supabase, Local Storage)
```

### State Management with Riverpod

`lib/presentation/providers/auth_provider.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/user_profile.dart';
import '../../data/services/auth_service.dart';
import '../../data/repositories/user_repository.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository(SupabaseService());
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

final currentUserProvider = FutureProvider<UserProfile?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final userRepository = ref.watch(userRepositoryProvider);
  
  final user = authService.currentUser;
  if (user == null) return null;
  
  return await userRepository.getUserProfile(user.id);
});
```

---

## Implementation Guides

See the following detailed guides in the `docs/flutter-mobile/` directory:

1. **[Authentication Flow](./authentication.md)** - Complete auth implementation
2. **[Patient Features](./patient-features.md)** - Appointments, wallet, consultations
3. **[Physician Features](./physician-features.md)** - Patient management, prescriptions
4. **[Hospital Features](./hospital-features.md)** - Admin dashboard, resources
5. **[Video Consultations](./video-consultations.md)** - WebRTC implementation
6. **[Payment Integration](./payment-integration.md)** - Paystack setup
7. **[Push Notifications](./push-notifications.md)** - Firebase Cloud Messaging
8. **[Offline Support](./offline-support.md)** - Local caching strategy

---

## Deployment

### Android Deployment

See [Android Deployment Guide](./deployment-android.md)

### iOS Deployment

See [iOS Deployment Guide](./deployment-ios.md)

---

## Security Best Practices

1. **Never store sensitive data in app code**
2. **Use environment variables for API keys**
3. **Implement proper RLS policies** (already done in Supabase)
4. **Use HTTPS for all network requests**
5. **Implement certificate pinning** for production
6. **Encrypt local storage** (use flutter_secure_storage)
7. **Implement biometric authentication** for sensitive operations

---

## Testing

1. **Unit Tests** - Test business logic
2. **Widget Tests** - Test UI components
3. **Integration Tests** - Test full user flows
4. **Platform Testing** - Test on real devices

---

## Maintenance & Updates

1. Keep Flutter SDK updated
2. Monitor Supabase database changes
3. Update dependencies regularly
4. Monitor crash reports (Firebase Crashlytics)
5. Track analytics (Firebase Analytics)

---

## Support & Resources

- **Flutter Documentation**: https://flutter.dev/docs
- **Supabase Flutter Documentation**: https://supabase.com/docs/guides/getting-started/tutorials/with-flutter
- **Riverpod Documentation**: https://riverpod.dev
- **WebRTC Flutter**: https://github.com/flutter-webrtc/flutter-webrtc

---

## Next Steps

1. Review the detailed implementation guides
2. Set up your development environment
3. Start with authentication flow
4. Implement role-based features
5. Test thoroughly on both platforms
6. Deploy to app stores

For detailed implementation of each feature, refer to the specific guide documents in this directory.
