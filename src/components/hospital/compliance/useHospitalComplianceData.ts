
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ComplianceTracking {
  id: string;
  hospital_id: string;
  compliance_type: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'under_review';
  score: number;
  last_assessment_date: string;
  next_assessment_due?: string;
  assessment_details: any;
  violations: any[];
  corrective_actions: any[];
  assessed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAlert {
  id: string;
  hospital_id: string;
  compliance_type: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  compliance_score?: number;
  due_date?: string;
  metadata: any;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export const useHospitalComplianceData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complianceData, setComplianceData] = useState<ComplianceTracking[]>([]);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplianceData = async () => {
    if (!profile?.hospital_id) return;

    try {
      setLoading(true);

      // Fetch compliance tracking data
      const { data: complianceTracking, error: complianceError } = await supabase
        .from('hospital_compliance_tracking')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .order('last_assessment_date', { ascending: false });

      if (complianceError) throw complianceError;

      // Fetch compliance alerts
      const { data: alertData, error: alertError } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (alertError) throw alertError;

      setComplianceData(complianceTracking || []);
      setAlerts(alertData || []);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch compliance data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateComplianceStatus = async (
    complianceId: string,
    status: ComplianceTracking['status'],
    score?: number,
    violations?: any[],
    correctiveActions?: any[]
  ) => {
    try {
      const updateData: any = {
        status,
        last_assessment_date: new Date().toISOString().split('T')[0],
        assessed_by: profile?.id
      };

      if (score !== undefined) updateData.score = score;
      if (violations) updateData.violations = violations;
      if (correctiveActions) updateData.corrective_actions = correctiveActions;

      const { error } = await supabase
        .from('hospital_compliance_tracking')
        .update(updateData)
        .eq('id', complianceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance status updated successfully.",
      });

      fetchComplianceData();
    } catch (error) {
      console.error('Error updating compliance status:', error);
      toast({
        title: "Error",
        description: "Failed to update compliance status.",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('compliance_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: profile?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance alert resolved successfully.",
      });

      fetchComplianceData();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive"
      });
    }
  };

  const calculateOverallScore = async () => {
    if (!profile?.hospital_id) return 0;

    try {
      const { data, error } = await supabase
        .rpc('calculate_hospital_compliance_score', {
          hospital_uuid: profile.hospital_id
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 0;
    }
  };

  const getComplianceSummary = () => {
    const compliantCount = complianceData.filter(c => c.status === 'compliant').length;
    const nonCompliantCount = complianceData.filter(c => c.status === 'non_compliant').length;
    const pendingCount = complianceData.filter(c => c.status === 'pending').length;
    const averageScore = complianceData.length > 0 
      ? complianceData.reduce((sum, c) => sum + c.score, 0) / complianceData.length 
      : 0;

    return {
      compliantCount,
      nonCompliantCount,
      pendingCount,
      averageScore: Math.round(averageScore),
      totalItems: complianceData.length,
      alertCount: alerts.length
    };
  };

  useEffect(() => {
    fetchComplianceData();
  }, [profile?.hospital_id]);

  return {
    complianceData,
    alerts,
    loading,
    updateComplianceStatus,
    resolveAlert,
    calculateOverallScore,
    refetch: fetchComplianceData,
    summary: getComplianceSummary()
  };
};
