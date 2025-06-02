
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, Crown, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    name: 'Basic',
    price: 1000,
    currency: 'NGN',
    features: [
      'AI Health Chat',
      'Basic Appointments',
      'Emergency Services',
      'Email Support'
    ],
    recommended: false
  },
  {
    name: 'Premium',
    price: 2500,
    currency: 'NGN',
    features: [
      'Everything in Basic',
      'Priority Appointments',
      'Transport Services',
      '24/7 Phone Support',
      'Health Analytics'
    ],
    recommended: true
  },
  {
    name: 'Enterprise',
    price: 5000,
    currency: 'NGN',
    features: [
      'Everything in Premium',
      'Dedicated Physician',
      'Family Coverage',
      'Home Visits',
      'Custom Health Plans'
    ],
    recommended: false
  }
];

export const SubscriptionUpgrade: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setLoading(plan.name);

    try {
      // Initialize Paystack inline payment
      const paymentData = {
        email: 'user@example.com', // You can get this from auth context
        amount: plan.price * 100, // Convert to kobo
        key: 'pk_live_c76c7a3791ff85134ea0478b00dc544aafb99738',
        ref: `plan_${plan.name}_${Date.now()}`,
        callback: function(response: any) {
          toast({
            title: "Payment Successful",
            description: `Successfully subscribed to ${plan.name} plan!`,
          });
          console.log('Payment successful:', response);
        },
        onClose: function() {
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled.",
            variant: "destructive"
          });
        }
      };

      // @ts-ignore - Paystack will be loaded from CDN
      if (typeof PaystackPop !== 'undefined') {
        // @ts-ignore
        const handler = PaystackPop.setup(paymentData);
        handler.openIframe();
      } else {
        // Fallback: redirect to Paystack payment page
        const paystackUrl = `https://checkout.paystack.com/v1/checkout.js`;
        const script = document.createElement('script');
        script.src = paystackUrl;
        script.onload = () => {
          // @ts-ignore
          const handler = PaystackPop.setup(paymentData);
          handler.openIframe();
        };
        document.head.appendChild(script);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your healthcare needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.recommended ? 'border-blue-500 shadow-lg' : ''}`}>
            {plan.recommended && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                <Star className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                {plan.name === 'Basic' && <CreditCard className="w-5 h-5" />}
                {plan.name === 'Premium' && <Crown className="w-5 h-5" />}
                {plan.name === 'Enterprise' && <Star className="w-5 h-5" />}
                {plan.name}
              </CardTitle>
              <div className="text-3xl font-bold">
                ₦{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.name}
                variant={plan.recommended ? "default" : "outline"}
              >
                {loading === plan.name ? "Processing..." : `Subscribe to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p>✓ Cancel anytime</p>
            <p>✓ Secure payment with Paystack</p>
            <p>✓ 30-day money-back guarantee</p>
          </div>
        </CardContent>
      </Card>

      {/* Load Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  );
};
