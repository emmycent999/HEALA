
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

export const getWalletByUserId = async (userId: string): Promise<Wallet | null> => {
  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
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

  return data || [];
};

export const creditWallet = async (walletId: string, amount: number, description: string, reference?: string) => {
  try {
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();

    if (walletError) throw walletError;

    const newBalance = wallet.balance + amount;

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', walletId);

    if (updateError) throw updateError;

    // Insert transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        transaction_type: 'credit',
        amount,
        balance_after: newBalance,
        description,
        reference_id: reference,
        status: 'completed'
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    return { success: true, transaction, new_balance: newBalance };
  } catch (error) {
    console.error('Error crediting wallet:', error);
    throw error;
  }
};

export const debitWallet = async (walletId: string, amount: number, description: string, reference?: string) => {
  try {
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();

    if (walletError) throw walletError;

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    const newBalance = wallet.balance - amount;

    // Update wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', walletId);

    if (updateError) throw updateError;

    // Insert transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        transaction_type: 'debit',
        amount,
        balance_after: newBalance,
        description,
        reference_id: reference,
        status: 'completed'
      })
      .select()
      .single();

    if (transactionError) throw transactionError;

    return { success: true, transaction, new_balance: newBalance };
  } catch (error) {
    console.error('Error debiting wallet:', error);
    throw error;
  }
};

export const requestWithdrawal = async (walletId: string, amount: number, bankDetails: any) => {
  try {
    // Check if withdrawal_requests table exists, if not create the request in a different way
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
