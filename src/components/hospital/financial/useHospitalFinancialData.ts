import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface FinancialTransaction {
  id: string;
  hospital_id: string;
  transaction_type: 'revenue' | 'expense' | 'payment';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  reference_id?: string;
  transaction_date: string;
  fiscal_month: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FinancialAlert {
  id: string;
  hospital_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  threshold_value?: number;
  current_value?: number;
  metadata: any;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export const useHospitalFinancialData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [alerts, setAlerts] = useState<FinancialAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFinancialData = async () => {
    if (!profile?.hospital_id) return;

    try {
      setLoading(true);

      // Fetch financial transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('hospital_financial_data')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (transactionError) throw transactionError;

      // Fetch financial alerts
      const { data: alertData, error: alertError } = await supabase
        .from('financial_alerts')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (alertError) throw alertError;

      // Type-cast the data to match our interfaces
      setTransactions((transactionData || []).map(t => ({
        ...t,
        transaction_type: t.transaction_type as FinancialTransaction['transaction_type'],
        metadata: t.metadata || {}
      })));
      
      setAlerts((alertData || []).map(a => ({
        ...a,
        severity: a.severity as FinancialAlert['severity'],
        metadata: a.metadata || {}
      })));
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<FinancialTransaction, 'id' | 'created_at' | 'updated_at' | 'fiscal_month'>) => {
    try {
      const { error } = await supabase
        .from('hospital_financial_data')
        .insert({
          ...transaction,
          hospital_id: profile?.hospital_id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Financial transaction recorded successfully.",
      });

      fetchFinancialData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction.",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('financial_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert resolved successfully.",
      });

      fetchFinancialData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive"
      });
    }
  };

  const getFinancialSummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTransactions = transactions.filter(t => t.fiscal_month === currentMonth);
    
    const totalRevenue = currentMonthTransactions
      .filter(t => t.transaction_type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = currentMonthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      transactionCount: currentMonthTransactions.length,
      alertCount: alerts.length
    };
  };

  useEffect(() => {
    fetchFinancialData();
  }, [profile?.hospital_id]);

  return {
    transactions,
    alerts,
    loading,
    addTransaction,
    resolveAlert,
    refetch: fetchFinancialData,
    summary: getFinancialSummary()
  };
};
