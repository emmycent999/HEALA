import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';

export const useConsultationPayment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const processConsultationPayment = async (sessionId: string, physicianId: string, amount: number) => {
    if (!user?.id) throw new Error('User not authenticated');

    setProcessing(true);
    try {
      // Get patient and physician wallets
      const patientWallet = await WalletService.getWallet(user.id);
      const physicianWallet = await WalletService.getWallet(physicianId);

      // Check if patient has sufficient balance
      if (patientWallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Process payment transfer
      await WalletService.processConsultationPayment(
        patientWallet.id,
        physicianWallet.id,
        amount,
        sessionId
      );

      // Update session payment status
      await supabase
        .from('consultation_sessions')
        .update({ 
          payment_status: 'paid',
          amount_paid: amount,
          paid_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      toast({
        title: "Payment Successful",
        description: `₦${amount.toLocaleString()} has been deducted from your wallet`
      });

      return true;
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processConsultationPayment,
    processing
  };
};