
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PaymentProcessorProps {
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentCancel: () => void;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initializePayment = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user.email,
          amount: amount,
          plan: 'in_person_booking_extra',
          metadata: {
            user_id: user.id,
            purpose: 'additional_booking'
          }
        }
      });

      if (error) throw error;

      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('Failed to initialize payment');
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          You've reached your monthly limit for free in-person consultations. 
          An additional payment of ₦{amount} is required for this booking.
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button
          onClick={initializePayment}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ₦{amount} with Paystack
            </>
          )}
        </Button>
        
        <Button
          onClick={onPaymentCancel}
          variant="outline"
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
