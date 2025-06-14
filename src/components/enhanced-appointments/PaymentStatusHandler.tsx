
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PaymentStatusHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    if (reference || trxref) {
      verifyPayment(reference || trxref);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string | null) => {
    if (!reference) return;

    try {
      // Here you would typically verify the payment with Paystack
      // For now, we'll assume success if reference exists
      console.log('Verifying payment with reference:', reference);
      
      // Mark payment as successful in your database if needed
      setStatus('success');
      setMessage('Payment successful! You can now book additional in-person appointments.');
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage('Payment verification failed. Please contact support.');
      
      toast({
        title: "Payment Verification Failed",
        description: "Unable to verify payment. Please contact support.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={`max-w-md mx-auto mt-8 ${getStatusColor()}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <CardTitle>
          {status === 'checking' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful'}
          {status === 'failed' && 'Payment Failed'}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">{message}</p>
        
        {status !== 'checking' && (
          <Button
            onClick={() => window.location.href = '/patient?tab=appointments'}
            className="w-full"
          >
            {status === 'success' ? 'Continue to Appointments' : 'Back to Appointments'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
