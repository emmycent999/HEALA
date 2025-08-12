import { supabase } from '@/integrations/supabase/client';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  transaction_type: 'credit' | 'debit';
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed';
  balance_after: number;
  created_at: string;
}

export class WalletService {
  static async getWallet(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create wallet if doesn't exist
      return await this.createWallet(userId);
    }
    
    if (error) throw error;
    return data;
  }

  static async createWallet(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0, currency: 'NGN' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async creditWallet(walletId: string, amount: number, description: string, reference?: string) {
    const { data, error } = await supabase.rpc('credit_wallet', {
      wallet_id_param: walletId,
      amount_param: amount,
      description_param: description,
      reference_param: reference
    });

    if (error) throw error;
    return data;
  }

  static async debitWallet(walletId: string, amount: number, description: string, reference?: string) {
    const { data, error } = await supabase.rpc('debit_wallet', {
      wallet_id_param: walletId,
      amount_param: amount,
      description_param: description,
      reference_param: reference
    });

    if (error) throw error;
    return data;
  }

  static async transferFunds(fromWalletId: string, toWalletId: string, amount: number, description: string) {
    const { data, error } = await supabase.rpc('transfer_funds', {
      from_wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      amount_param: amount,
      description_param: description
    });

    if (error) throw error;
    return data;
  }

  static async initiateWithdrawal(walletId: string, amount: number, bankDetails: any) {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .insert({
        wallet_id: walletId,
        amount,
        bank_details: bankDetails,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async processConsultationPayment(patientWalletId: string, physicianWalletId: string, amount: number, sessionId: string) {
    return await this.transferFunds(
      patientWalletId,
      physicianWalletId,
      amount,
      `Virtual consultation payment - Session ${sessionId}`
    );
  }
}