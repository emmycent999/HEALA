
import { supabase } from '@/integrations/supabase/client';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description: string;
  reference_id?: string;
  status: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const getWallet = async (userId: string): Promise<Wallet> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching wallet:', error);
    throw error;
  }

  return data;
};

export const getWalletTransactions = async (walletId: string): Promise<WalletTransaction[]> => {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  // Cast transaction_type to proper union type
  return (data || []).map(tx => ({
    ...tx,
    transaction_type: tx.transaction_type as 'credit' | 'debit'
  }));
};

export const creditWallet = async (walletId: string, amount: number, description: string, reference?: string) => {
  const { data, error } = await supabase.rpc('credit_wallet', {
    wallet_id_param: walletId,
    amount_param: amount,
    description_param: description,
    reference_param: reference
  });

  if (error) throw error;
  return data;
};

export const debitWallet = async (walletId: string, amount: number, description: string, reference?: string) => {
  const { data, error } = await supabase.rpc('debit_wallet', {
    wallet_id_param: walletId,
    amount_param: amount,
    description_param: description,
    reference_param: reference
  });

  if (error) throw error;
  return data;
};

export const processConsultationPayment = async (fromWalletId: string, toWalletId: string, amount: number, sessionId: string) => {
  const { data, error } = await supabase.rpc('transfer_funds', {
    from_wallet_id: fromWalletId,
    to_wallet_id: toWalletId,
    amount_param: amount,
    description_param: `Consultation payment - Session ${sessionId}`
  });

  if (error) throw error;
  return data;
};

export const initiateWithdrawal = async (walletId: string, amount: number, bankDetails: any) => {
  try {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        transaction_type: 'debit',
        amount,
        balance_after: 0, // Will be updated after processing
        description: `Withdrawal request - ${JSON.stringify(bankDetails)}`,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, request: data };
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    throw error;
  }
};

// Create a namespace object for backwards compatibility
export const WalletService = {
  getWallet,
  getWalletTransactions,
  creditWallet,
  debitWallet,
  processConsultationPayment,
  initiateWithdrawal
};
