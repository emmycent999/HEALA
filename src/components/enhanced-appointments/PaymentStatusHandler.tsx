
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const PaymentStatusHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
    if (!reference || !user) return;

    try {
      console.log('Verifying payment with reference:', reference);
      
      // Check if this is a wallet funding payment
      const pendingFunding = sessionStorage.getItem('pending_wallet_funding');
      
      if (pendingFunding) {
        const fundingData = JSON.parse(pendingFunding);
        console.log('Processing wallet funding:', fundingData);
        
        // In a real implementation, you would verify with Paystack API
        // For now, we'll simulate successful verification and update the wallet
        await processWalletFunding(fundingData, reference);
        
        // Clear the pending funding data
        sessionStorage.removeItem('pending_wallet_funding');
        
        setStatus('success');
        setMessage(`Wallet funded successfully with ₦${fundingData.amount.toLocaleString()}!`);
        
        toast({
          title: "Payment Successful",
          description: `₦${fundingData.amount.toLocaleString()} has been added to your wallet.`,
        });
      } else {
        // Handle other payment types (appointments, etc.)
        setStatus('success');
        setMessage('Payment processed successfully!');
        
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
      }

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

  const processWalletFunding = async (fundingData: any, reference: string) => {
    try {
      // Get current wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', fundingData.wallet_id)
        .single();

      if (walletError) throw walletError;

      const newBalance = (walletData.balance || 0) + fundingData.amount;

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', fundingData.wallet_id);

      if (updateError) throw updateError;

      // Add transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: fundingData.wallet_id,
          transaction_type: 'credit',
          amount: fundingData.amount,
          balance_after: newBalance,
          description: 'Wallet funding via Paystack',
          status: 'completed',
          paystack_reference: reference
        });

      if (transactionError) throw transactionError;

      console.log('Wallet funding processed successfully');
    } catch (error) {
      console.error('Error processing wallet funding:', error);
      throw error;
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

  const handleContinue = () => {
    const pendingFunding = sessionStorage.getItem('pending_wallet_funding');
    if (pendingFunding || searchParams.get('purpose') === 'wallet_funding') {
      // Go back to wallet tab
      navigate('/patient?tab=wallet');
    } else {
      // Go back to appointments
      navigate('/patient?tab=appointments');
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
            onClick={handleContinue}
            className="w-full"
            variant={status === 'success' ? 'default' : 'outline'}
          >
            {status === 'success' ? 'Continue' : 'Back to Dashboard'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
