# Backend and Database Integration Guide

This guide explains how to integrate the Flutter mobile app with the existing HEALA Supabase backend and database.

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Supabase Client Setup](#supabase-client-setup)
3. [Data Layer Architecture](#data-layer-architecture)
4. [CRUD Operations](#crud-operations)
5. [Real-time Updates](#real-time-updates)
6. [File Storage](#file-storage)
7. [Edge Functions](#edge-functions)
8. [Error Handling](#error-handling)

---

## Database Schema Overview

### Key Tables

The HEALA database consists of the following main tables:

#### User Management
- **profiles** - User profiles with role-based data
- **users** - Basic user information (Supabase auth)

#### Healthcare Operations
- **appointments** - Patient-physician appointments
- **prescriptions** - Medication prescriptions
- **health_records** - Patient medical history
- **medical_history_documents** - Uploaded medical documents

#### Virtual Consultations
- **consultation_sessions** - Video consultation sessions
- **consultation_rooms** - WebRTC room management
- **consultation_messages** - In-consultation chat

#### Financial
- **wallets** - User wallet balances
- **wallet_transactions** - Transaction history
- **withdrawal_requests** - Withdrawal requests

#### Emergency Services
- **emergency_requests** - Emergency help requests
- **ambulance_requests** - Ambulance bookings
- **emergency_contacts** - Patient emergency contacts

#### Hospital Management
- **hospitals** - Hospital information
- **hospital_patients** - Hospital patient records
- **hospital_resources** - Medical equipment/resources
- **patient_waitlist** - Patient waiting queue

#### Communication
- **conversations** - Chat conversations
- **messages** - Chat messages

#### Administration
- **admin_actions** - Admin activity logs
- **compliance_reports** - Compliance tracking
- **analytics_data** - System analytics

---

## Supabase Client Setup

### 1. Create Supabase Service

`lib/data/services/supabase_service.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/config/supabase_config.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();
  
  final SupabaseClient client = SupabaseConfig.client;
  
  // Auth helpers
  User? get currentUser => client.auth.currentUser;
  String? get currentUserId => currentUser?.id;
  
  // Check if user is authenticated
  bool get isAuthenticated => currentUser != null;
}
```

### 2. Environment Configuration

Create `.env` file (add to .gitignore):

```env
SUPABASE_URL=https://hzznoxctqybcberrkgjt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5veGN0cXliY2JlcnJrZ2p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNzc2OTMsImV4cCI6MjA2MzY1MzY5M30.CRpYAbPa00yuEsSYtzIDujX1xcCpJAOk2VYtxh9msJ0
```

Use `flutter_dotenv` package to load:

```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

await dotenv.load(fileName: ".env");
String supabaseUrl = dotenv.env['SUPABASE_URL']!;
String supabaseKey = dotenv.env['SUPABASE_ANON_KEY']!;
```

---

## Data Layer Architecture

### Repository Pattern

```
UI Layer
    ↓
State Management (Provider/Bloc)
    ↓
Repository (Business Logic)
    ↓
Data Source (Supabase)
```

### Example: Appointment Repository

`lib/data/repositories/appointment_repository.dart`:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/appointment.dart';
import '../services/supabase_service.dart';

class AppointmentRepository {
  final SupabaseService _supabase = SupabaseService();
  
  // Get user appointments
  Future<List<Appointment>> getUserAppointments(String userId) async {
    try {
      final response = await _supabase.client
          .from('appointments')
          .select('''
            *,
            physician:profiles!physician_id(
              id,
              first_name,
              last_name,
              specialization
            ),
            hospital:hospitals(
              id,
              name,
              address
            )
          ''')
          .eq('patient_id', userId)
          .order('appointment_date', ascending: false);
      
      return (response as List)
          .map((json) => Appointment.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch appointments: $e');
    }
  }
  
  // Create appointment
  Future<Appointment> createAppointment(Map<String, dynamic> data) async {
    try {
      final response = await _supabase.client
          .from('appointments')
          .insert(data)
          .select()
          .single();
      
      return Appointment.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create appointment: $e');
    }
  }
  
  // Update appointment
  Future<void> updateAppointment(
    String appointmentId,
    Map<String, dynamic> updates,
  ) async {
    try {
      await _supabase.client
          .from('appointments')
          .update(updates)
          .eq('id', appointmentId);
    } catch (e) {
      throw Exception('Failed to update appointment: $e');
    }
  }
  
  // Cancel appointment
  Future<void> cancelAppointment(String appointmentId) async {
    try {
      await _supabase.client
          .from('appointments')
          .update({'status': 'cancelled'})
          .eq('id', appointmentId);
    } catch (e) {
      throw Exception('Failed to cancel appointment: $e');
    }
  }
}
```

---

## CRUD Operations

### Select (Read) Operations

#### Simple Select

```dart
// Get all active physicians
final physicians = await _supabase.client
    .from('profiles')
    .select()
    .eq('role', 'physician')
    .eq('is_active', true);
```

#### Select with Relations (Joins)

```dart
// Get appointments with physician and hospital data
final appointments = await _supabase.client
    .from('appointments')
    .select('''
      *,
      physician:profiles!physician_id(first_name, last_name),
      hospital:hospitals(name, address)
    ''')
    .eq('patient_id', userId);
```

#### Select with Filters

```dart
// Get pending appointments for today
final today = DateTime.now();
final todayStr = '${today.year}-${today.month}-${today.day}';

final appointments = await _supabase.client
    .from('appointments')
    .select()
    .eq('status', 'pending')
    .gte('appointment_date', todayStr)
    .lt('appointment_date', todayStr + ' 23:59:59')
    .order('appointment_time');
```

### Insert Operations

#### Single Insert

```dart
// Create new appointment
final newAppointment = await _supabase.client
    .from('appointments')
    .insert({
      'patient_id': userId,
      'physician_id': physicianId,
      'appointment_date': appointmentDate,
      'appointment_time': appointmentTime,
      'consultation_type': 'in_person',
      'status': 'pending',
    })
    .select()
    .single();
```

#### Bulk Insert

```dart
// Insert multiple records
await _supabase.client
    .from('emergency_contacts')
    .insert([
      {'patient_id': userId, 'name': 'Contact 1', 'phone': '123'},
      {'patient_id': userId, 'name': 'Contact 2', 'phone': '456'},
    ]);
```

### Update Operations

```dart
// Update appointment status
await _supabase.client
    .from('appointments')
    .update({'status': 'confirmed'})
    .eq('id', appointmentId);

// Update multiple fields
await _supabase.client
    .from('profiles')
    .update({
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
      'updated_at': DateTime.now().toIso8601String(),
    })
    .eq('id', userId);
```

### Delete Operations

```dart
// Soft delete (update status)
await _supabase.client
    .from('appointments')
    .update({'status': 'cancelled'})
    .eq('id', appointmentId);

// Hard delete (if needed)
await _supabase.client
    .from('emergency_contacts')
    .delete()
    .eq('id', contactId);
```

---

## Real-time Updates

### Subscribe to Table Changes

```dart
class RealtimeAppointmentService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  RealtimeChannel? _channel;
  
  // Subscribe to appointment updates
  void subscribeToAppointments(
    String userId,
    Function(Map<String, dynamic>) onInsert,
    Function(Map<String, dynamic>) onUpdate,
    Function(Map<String, dynamic>) onDelete,
  ) {
    _channel = _supabase
        .channel('appointments_$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'patient_id',
            value: userId,
          ),
          callback: (payload) => onInsert(payload.newRecord),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'patient_id',
            value: userId,
          ),
          callback: (payload) => onUpdate(payload.newRecord),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.delete,
          schema: 'public',
          table: 'appointments',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'patient_id',
            value: userId,
          ),
          callback: (payload) => onDelete(payload.oldRecord),
        )
        .subscribe();
  }
  
  // Unsubscribe
  Future<void> unsubscribe() async {
    if (_channel != null) {
      await _supabase.removeChannel(_channel!);
      _channel = null;
    }
  }
}
```

### Using Real-time in UI

```dart
class AppointmentListScreen extends ConsumerStatefulWidget {
  @override
  _AppointmentListScreenState createState() => _AppointmentListScreenState();
}

class _AppointmentListScreenState extends ConsumerState<AppointmentListScreen> {
  final RealtimeAppointmentService _realtimeService = RealtimeAppointmentService();
  
  @override
  void initState() {
    super.initState();
    
    final userId = ref.read(authServiceProvider).currentUser?.id;
    if (userId != null) {
      _realtimeService.subscribeToAppointments(
        userId,
        (newAppointment) {
          // Handle new appointment
          ref.read(appointmentsProvider.notifier).addAppointment(newAppointment);
        },
        (updatedAppointment) {
          // Handle updated appointment
          ref.read(appointmentsProvider.notifier).updateAppointment(updatedAppointment);
        },
        (deletedAppointment) {
          // Handle deleted appointment
          ref.read(appointmentsProvider.notifier).removeAppointment(deletedAppointment['id']);
        },
      );
    }
  }
  
  @override
  void dispose() {
    _realtimeService.unsubscribe();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final appointments = ref.watch(appointmentsProvider);
    // Build UI...
  }
}
```

---

## File Storage

### Upload Files

```dart
class StorageService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  
  // Upload medical document
  Future<String> uploadMedicalDocument(
    String userId,
    File file,
    String fileName,
  ) async {
    try {
      final filePath = '$userId/${DateTime.now().millisecondsSinceEpoch}_$fileName';
      
      await _supabase.storage
          .from('physician-documents')
          .upload(filePath, file);
      
      final publicUrl = _supabase.storage
          .from('physician-documents')
          .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (e) {
      throw Exception('Failed to upload document: $e');
    }
  }
  
  // Download file
  Future<Uint8List> downloadFile(String path) async {
    try {
      final bytes = await _supabase.storage
          .from('physician-documents')
          .download(path);
      
      return bytes;
    } catch (e) {
      throw Exception('Failed to download file: $e');
    }
  }
  
  // Delete file
  Future<void> deleteFile(String path) async {
    try {
      await _supabase.storage
          .from('physician-documents')
          .remove([path]);
    } catch (e) {
      throw Exception('Failed to delete file: $e');
    }
  }
}
```

---

## Edge Functions

### Call Edge Functions

```dart
class PaymentService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  
  // Initialize payment
  Future<Map<String, dynamic>> initializePayment({
    required double amount,
    required String email,
  }) async {
    try {
      final response = await _supabase.functions.invoke(
        'paystack-payment',
        body: {
          'amount': amount * 100, // Convert to kobo
          'email': email,
          'currency': 'NGN',
        },
      );
      
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to initialize payment: $e');
    }
  }
  
  // Verify payment
  Future<bool> verifyPayment(String reference) async {
    try {
      final response = await _supabase.functions.invoke(
        'verify-paystack-payment',
        body: {'reference': reference},
      );
      
      return response.data['status'] == 'success';
    } catch (e) {
      throw Exception('Failed to verify payment: $e');
    }
  }
}
```

---

## Error Handling

### Custom Error Handler

```dart
class SupabaseError {
  final String message;
  final String? code;
  final dynamic details;
  
  SupabaseError({
    required this.message,
    this.code,
    this.details,
  });
  
  factory SupabaseError.fromException(dynamic error) {
    if (error is PostgrestException) {
      return SupabaseError(
        message: error.message,
        code: error.code,
        details: error.details,
      );
    }
    
    return SupabaseError(
      message: error.toString(),
    );
  }
  
  String get userMessage {
    // Map technical errors to user-friendly messages
    if (code == '23505') {
      return 'This record already exists.';
    } else if (code == '23503') {
      return 'Referenced record not found.';
    } else if (message.contains('JWT')) {
      return 'Authentication expired. Please login again.';
    }
    
    return 'An error occurred. Please try again.';
  }
}
```

### Repository with Error Handling

```dart
class AppointmentRepository {
  Future<Result<List<Appointment>>> getUserAppointments(String userId) async {
    try {
      final response = await _supabase.client
          .from('appointments')
          .select()
          .eq('patient_id', userId);
      
      final appointments = (response as List)
          .map((json) => Appointment.fromJson(json))
          .toList();
      
      return Result.success(appointments);
    } catch (e) {
      final error = SupabaseError.fromException(e);
      return Result.failure(error);
    }
  }
}

// Result class
class Result<T> {
  final T? data;
  final SupabaseError? error;
  final bool isSuccess;
  
  Result.success(this.data)
      : error = null,
        isSuccess = true;
  
  Result.failure(this.error)
      : data = null,
        isSuccess = false;
}
```

---

## Database Functions Usage

### Call Custom Database Functions

```dart
// Check booking limit
Future<Map<String, dynamic>> checkBookingLimit(String patientId) async {
  try {
    final response = await _supabase.client
        .rpc('check_inperson_booking_limit', params: {
      'patient_uuid': patientId,
    });
    
    return response as Map<String, dynamic>;
  } catch (e) {
    throw Exception('Failed to check booking limit: $e');
  }
}

// Get nearby physicians
Future<List<Map<String, dynamic>>> getNearbyPhysicians({
  required double latitude,
  required double longitude,
  double radiusKm = 50,
  String? specialty,
}) async {
  try {
    final response = await _supabase.client
        .rpc('get_nearby_physicians', params: {
      'patient_lat': latitude,
      'patient_lng': longitude,
      'search_radius_km': radiusKm,
      'specialty_filter': specialty,
    });
    
    return (response as List).cast<Map<String, dynamic>>();
  } catch (e) {
    throw Exception('Failed to get nearby physicians: $e');
  }
}
```

---

## Best Practices

### 1. Connection Management

```dart
// Check internet connectivity before operations
Future<bool> checkConnectivity() async {
  final connectivityResult = await Connectivity().checkConnectivity();
  return connectivityResult != ConnectivityResult.none;
}
```

### 2. Caching Strategy

```dart
// Cache data locally using Hive
class CacheService {
  static const String appointmentsBox = 'appointments_cache';
  
  Future<void> cacheAppointments(List<Appointment> appointments) async {
    final box = await Hive.openBox(appointmentsBox);
    await box.put('appointments', appointments.map((a) => a.toJson()).toList());
  }
  
  Future<List<Appointment>?> getCachedAppointments() async {
    final box = await Hive.openBox(appointmentsBox);
    final cached = box.get('appointments');
    if (cached == null) return null;
    
    return (cached as List)
        .map((json) => Appointment.fromJson(json))
        .toList();
  }
}
```

### 3. Retry Logic

```dart
Future<T> retryOperation<T>(
  Future<T> Function() operation, {
  int maxAttempts = 3,
  Duration delay = const Duration(seconds: 2),
}) async {
  int attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      return await operation();
    } catch (e) {
      attempts++;
      if (attempts >= maxAttempts) rethrow;
      await Future.delayed(delay);
    }
  }
  
  throw Exception('Max retry attempts reached');
}
```

---

## Testing

### Mock Supabase Client

```dart
class MockSupabaseClient extends Mock implements SupabaseClient {}

void main() {
  group('AppointmentRepository', () {
    late MockSupabaseClient mockClient;
    late AppointmentRepository repository;
    
    setUp(() {
      mockClient = MockSupabaseClient();
      repository = AppointmentRepository(mockClient);
    });
    
    test('getUserAppointments returns appointments', () async {
      // Arrange
      when(mockClient.from('appointments').select())
          .thenAnswer((_) => Future.value([
            {'id': '1', 'patient_id': 'user1'},
          ]));
      
      // Act
      final result = await repository.getUserAppointments('user1');
      
      // Assert
      expect(result.isSuccess, true);
      expect(result.data?.length, 1);
    });
  });
}
```

---

## Next Steps

1. Implement specific repositories for each feature
2. Add offline-first capabilities with Hive
3. Set up real-time listeners for critical data
4. Implement proper error handling and retry logic
5. Add comprehensive unit and integration tests
6. Monitor and optimize database queries

For feature-specific implementations, refer to the respective guides in the `/docs/flutter-mobile/` directory.
