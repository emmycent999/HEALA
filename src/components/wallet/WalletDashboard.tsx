
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

export const WalletDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState('');
  const [fundingWallet, setFundingWallet] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (walletData) {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to fund your wallet.",
        variant: "destructive"
      });
      return;
    }

    setFundingWallet(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user?.email,
          amount: parseFloat(fundAmount),
          metadata: {
            user_id: user?.id,
            purpose: 'wallet_funding'
          }
        }
      });

      if (error) throw error;

      if (data.status && data.data && data.data.authorization_url) {
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error funding wallet:', error);
      toast({
        title: "Funding Error",
        description: "Failed to initialize wallet funding. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFundingWallet(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  if (loading) {
    return <div className="p-6">Loading wallet...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            My Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600 mb-4">
            {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fund Wallet</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="100"
                />
                <Button 
                  onClick={handleFundWallet}
                  disabled={fundingWallet}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {fundingWallet ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Fund
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {transaction.transaction_type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
