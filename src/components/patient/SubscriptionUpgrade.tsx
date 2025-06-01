
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  name: string;
  price: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

export const SubscriptionUpgrade: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string>('');
  const [currentSubscription, setCurrentSubscription] = useState<string>('basic');

  const plans: SubscriptionPlan[] = [
    {
      name: 'basic',
      price: 0,
      features: [
        '3 appointments per month',
        'Basic AI health chat',
        'Emergency services',
        'Basic support'
      ],
      icon: <Star className="w-6 h-6" />,
      color: 'bg-gray-100 border-gray-200'
    },
    {
      name: 'premium',
      price: 10000,
      features: [
        'Unlimited appointments',
        'Advanced AI health chat',
        'Priority emergency services',
        'Physician direct chat',
        'Health analytics',
        'Priority support'
      ],
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      name: 'enterprise',
      price: 20000,
      features: [
        'Everything in Premium',
        'Dedicated physician',
        'Family health management',
        'Advanced health insights',
        'Custom health plans',
        '24/7 priority support',
        'Telemedicine sessions'
      ],
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchCurrentSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan_name, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (data) {
        setCurrentSubscription(data.plan_name);
      } else {
        setCurrentSubscription(profile?.subscription_plan || 'basic');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!user || !user.email) return;

    setLoading(planName);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          plan: planName,
          email: user.email
        }
      });

      if (error) throw error;

      if (data.success) {
        // Open Paystack checkout in a new tab
        window.open(data.authorization_url, '_blank');
        
        toast({
          title: "Payment Initialized",
          description: "Complete payment to upgrade your subscription.",
        });
      } else {
        throw new Error('Payment initialization failed');
      }

    } catch (error) {
      console.error('Error initializing payment:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment.",
        variant: "destructive"
      });
    } finally {
      setLoading('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">
          Current plan: <Badge variant="outline">{currentSubscription}</Badge>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative ${plan.color} ${
              currentSubscription === plan.name ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {currentSubscription === plan.name && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500">
                Current Plan
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {plan.icon}
              </div>
              <CardTitle className="capitalize">{plan.name}</CardTitle>
              <div className="text-2xl font-bold">
                ₦{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={currentSubscription === plan.name ? "outline" : "default"}
                disabled={currentSubscription === plan.name || loading === plan.name || plan.name === 'basic'}
                onClick={() => handleUpgrade(plan.name)}
              >
                {loading === plan.name ? 'Processing...' : 
                 currentSubscription === plan.name ? 'Current Plan' :
                 plan.name === 'basic' ? 'Free' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
