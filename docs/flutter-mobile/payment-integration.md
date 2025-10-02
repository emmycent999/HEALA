# Payment Integration with Paystack

Complete guide for integrating Paystack payment gateway in the HEALA Flutter mobile app.

## Overview

HEALA uses Paystack for processing payments in Nigeria (NGN currency). This includes:
- Wallet funding
- Consultation payments
- Subscription upgrades
- Emergency service payments

## Setup

### 1. Add Dependencies

```yaml
dependencies:
  flutter_paystack: ^1.0.7
```

### 2. Paystack Configuration

```dart
// lib/core/config/paystack_config.dart
class PaystackConfig {
  // Use your Paystack public key (from Supabase secrets or environment)
  static const String publicKey = 'pk_test_xxxxxxxxxxxx'; // Replace with actual key
  
  static const String currency = 'NGN';
  
  // Initialize Paystack
  static void initialize() {
    PaystackPlugin.initialize(
      publicKey: publicKey,
    );
  }
}
```

Initialize in main.dart:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Paystack
  PaystackConfig.initialize();
  
  // Initialize Supabase
  await SupabaseConfig.initialize();
  
  runApp(
    const ProviderScope(
      child: HealaApp(),
    ),
  );
}
```

## Payment Service Implementation

### 1. Payment Service

```dart
// lib/data/services/payment_service.dart
import 'package:flutter_paystack/flutter_paystack.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/config/paystack_config.dart';
import '../../core/config/supabase_config.dart';

class PaymentService {
  final SupabaseClient _supabase = SupabaseConfig.client;
  final PaystackPlugin _paystack = PaystackPlugin();
  
  // Initialize payment on backend
  Future<Map<String, dynamic>> initializePayment({
    required double amount,
    required String email,
    required String purpose, // 'wallet_funding', 'consultation', etc.
    Map<String, dynamic>? metadata,
  }) async {
    try {
      // Convert Naira to Kobo (Paystack uses kobo - smallest currency unit)
      final amountInKobo = (amount * 100).round();
      
      final response = await _supabase.functions.invoke(
        'paystack-payment',
        body: {
          'amount': amountInKobo,
          'email': email,
          'currency': PaystackConfig.currency,
          'metadata': {
            ...?metadata,
            'purpose': purpose,
            'user_id': _supabase.auth.currentUser?.id,
          },
        },
      );
      
      if (response.data == null) {
        throw Exception('Failed to initialize payment');
      }
      
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Payment initialization failed: $e');
    }
  }
  
  // Charge card using Paystack
  Future<PaymentResponse> chargeCard({
    required BuildContext context,
    required String email,
    required double amount,
    required String reference,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final charge = Charge()
        ..amount = (amount * 100).round() // Convert to kobo
        ..email = email
        ..reference = reference
        ..currency = PaystackConfig.currency
        ..metadata = metadata;
      
      final response = await _paystack.checkout(
        context,
        method: CheckoutMethod.card,
        charge: charge,
      );
      
      return PaymentResponse(
        success: response.status,
        reference: response.reference,
        message: response.message,
      );
    } catch (e) {
      throw Exception('Card charge failed: $e');
    }
  }
  
  // Verify payment
  Future<bool> verifyPayment(String reference) async {
    try {
      final response = await _supabase.functions.invoke(
        'verify-paystack-payment',
        body: {'reference': reference},
      );
      
      if (response.data == null) {
        return false;
      }
      
      final data = response.data as Map<String, dynamic>;
      return data['status'] == 'success';
    } catch (e) {
      throw Exception('Payment verification failed: $e');
    }
  }
  
  // Complete payment process
  Future<PaymentResult> processPayment({
    required BuildContext context,
    required double amount,
    required String purpose,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        throw Exception('User not authenticated');
      }
      
      // Step 1: Initialize payment on backend
      final initResponse = await initializePayment(
        amount: amount,
        email: user.email!,
        purpose: purpose,
        metadata: metadata,
      );
      
      final reference = initResponse['reference'] as String;
      
      // Step 2: Charge the user's card
      final chargeResponse = await chargeCard(
        context: context,
        email: user.email!,
        amount: amount,
        reference: reference,
        metadata: metadata,
      );
      
      if (!chargeResponse.success) {
        return PaymentResult(
          success: false,
          message: chargeResponse.message ?? 'Payment failed',
        );
      }
      
      // Step 3: Verify payment on backend
      final verified = await verifyPayment(reference);
      
      if (!verified) {
        return PaymentResult(
          success: false,
          message: 'Payment verification failed',
        );
      }
      
      return PaymentResult(
        success: true,
        message: 'Payment successful',
        reference: reference,
      );
    } catch (e) {
      return PaymentResult(
        success: false,
        message: 'Payment failed: ${e.toString()}',
      );
    }
  }
}

// Payment Response Model
class PaymentResponse {
  final bool success;
  final String? reference;
  final String? message;
  
  PaymentResponse({
    required this.success,
    this.reference,
    this.message,
  });
}

// Payment Result Model
class PaymentResult {
  final bool success;
  final String message;
  final String? reference;
  
  PaymentResult({
    required this.success,
    required this.message,
    this.reference,
  });
}
```

## UI Implementation

### 1. Wallet Funding Screen

```dart
// lib/presentation/screens/wallet/fund_wallet_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class FundWalletScreen extends ConsumerStatefulWidget {
  const FundWalletScreen({super.key});

  @override
  ConsumerState<FundWalletScreen> createState() => _FundWalletScreenState();
}

class _FundWalletScreenState extends ConsumerState<FundWalletScreen> {
  final _amountController = TextEditingController();
  bool _isProcessing = false;
  
  // Quick amounts for easy selection
  final List<double> _quickAmounts = [1000, 2000, 5000, 10000, 20000];
  
  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }
  
  Future<void> _fundWallet() async {
    final amount = double.tryParse(_amountController.text);
    
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a valid amount'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    setState(() => _isProcessing = true);
    
    try {
      final paymentService = ref.read(paymentServiceProvider);
      
      final result = await paymentService.processPayment(
        context: context,
        amount: amount,
        purpose: 'wallet_funding',
        metadata: {
          'type': 'wallet_topup',
          'amount_ngn': amount,
        },
      );
      
      if (!mounted) return;
      
      if (result.success) {
        // Refresh wallet balance
        ref.invalidate(walletBalanceProvider);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('₦${amount.toStringAsFixed(2)} added to wallet'),
            backgroundColor: Colors.green,
          ),
        );
        
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fund Wallet'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Current Balance
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Text(
                      'Current Balance',
                      style: TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Consumer(
                      builder: (context, ref, child) {
                        final balance = ref.watch(walletBalanceProvider);
                        return balance.when(
                          data: (amount) => Text(
                            '₦${amount.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                          loading: () => const CircularProgressIndicator(),
                          error: (_, __) => const Text('Error loading balance'),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            
            // Amount Input
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Amount (NGN)',
                prefixText: '₦',
                border: OutlineInputBorder(),
                hintText: '0.00',
              ),
            ),
            const SizedBox(height: 16),
            
            // Quick Amount Buttons
            const Text('Quick Select:'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickAmounts.map((amount) {
                return ElevatedButton(
                  onPressed: () {
                    _amountController.text = amount.toStringAsFixed(0);
                  },
                  child: Text('₦${amount.toStringAsFixed(0)}'),
                );
              }).toList(),
            ),
            const Spacer(),
            
            // Fund Button
            ElevatedButton(
              onPressed: _isProcessing ? null : _fundWallet,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator()
                  : const Text('Fund Wallet'),
            ),
            
            // Payment Info
            const SizedBox(height: 16),
            Text(
              'Payments are processed securely via Paystack',
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
```

### 2. Payment Provider

```dart
// lib/presentation/providers/payment_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/services/payment_service.dart';
import '../../data/services/wallet_service.dart';
import './auth_provider.dart';

final paymentServiceProvider = Provider((ref) => PaymentService());

final walletServiceProvider = Provider((ref) => WalletService());

final walletBalanceProvider = FutureProvider<double>((ref) async {
  final walletService = ref.watch(walletServiceProvider);
  final authService = ref.watch(authServiceProvider);
  
  final userId = authService.currentUser?.id;
  if (userId == null) return 0.0;
  
  final wallet = await walletService.getWallet(userId);
  return wallet.balance;
});
```

## Consultation Payment

```dart
// When booking a paid consultation
Future<void> bookConsultation() async {
  final paymentService = ref.read(paymentServiceProvider);
  
  // First check wallet balance
  final walletBalance = await ref.read(walletBalanceProvider.future);
  
  if (walletBalance >= consultationFee) {
    // Pay from wallet
    await payFromWallet(consultationFee);
  } else {
    // Top up wallet first
    final result = await paymentService.processPayment(
      context: context,
      amount: consultationFee,
      purpose: 'consultation_payment',
      metadata: {
        'consultation_id': consultationId,
        'physician_id': physicianId,
      },
    );
    
    if (result.success) {
      // Book the consultation
      await createConsultationSession();
    }
  }
}
```

## Subscription Upgrade

```dart
// Upgrade subscription with payment
Future<void> upgradeSubscription(String newPlan) async {
  final plans = {
    'basic': 0.0,
    'premium': 5000.0,
    'enterprise': 15000.0,
  };
  
  final amount = plans[newPlan]!;
  
  final paymentService = ref.read(paymentServiceProvider);
  final result = await paymentService.processPayment(
    context: context,
    amount: amount,
    purpose: 'subscription_upgrade',
    metadata: {
      'new_plan': newPlan,
      'previous_plan': currentPlan,
    },
  );
  
  if (result.success) {
    // Update user profile
    await updateUserSubscription(newPlan);
  }
}
```

## Error Handling

```dart
Future<void> handlePayment() async {
  try {
    final result = await paymentService.processPayment(
      context: context,
      amount: amount,
      purpose: purpose,
      metadata: metadata,
    );
    
    if (!result.success) {
      // Handle specific Paystack errors
      if (result.message.contains('card')) {
        // Card-related error
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Card Error'),
            content: const Text(
              'There was an issue with your card. Please try a different card or contact your bank.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else if (result.message.contains('insufficient')) {
        // Insufficient funds
        showInsufficientFundsDialog();
      } else {
        // Generic error
        showErrorSnackBar(result.message);
      }
    }
  } on SocketException {
    // No internet connection
    showErrorSnackBar('No internet connection');
  } catch (e) {
    // Unknown error
    showErrorSnackBar('An unexpected error occurred');
  }
}
```

## Testing

### Test Mode

```dart
// Use test keys for development
static const String publicKey = 'pk_test_xxxxxxxxxxxx';

// Test cards (Paystack test mode)
// Card: 4084084084084081
// CVV: 408
// Expiry: Any future date
// PIN: 0000
// OTP: 123456
```

### Production

```dart
// Use live keys for production
static const String publicKey = 'pk_live_xxxxxxxxxxxx';

// Make sure to:
// 1. Use environment variables
// 2. Implement proper error logging
// 3. Add transaction tracking
// 4. Implement webhook verification
```

## Security Best Practices

1. **Never store card details** - Let Paystack handle it
2. **Use HTTPS only** - All API calls must be encrypted
3. **Implement webhook verification** - Verify payment status server-side
4. **Log all transactions** - For audit and debugging
5. **Handle PCI compliance** - Follow Paystack's guidelines
6. **Implement timeout handling** - For slow networks
7. **Add retry logic** - For failed verifications

This completes the Paystack payment integration guide for the HEALA Flutter mobile app.
