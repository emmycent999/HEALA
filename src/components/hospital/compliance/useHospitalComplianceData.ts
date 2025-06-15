
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ComplianceTracking, ComplianceAlert } from './types';
import {
  fetchComplianceTracking,
  fetchComplianceAlerts,
  updateComplianceStatus as updateComplianceStatusService,
  resolveComplianceAlert as resolveComplianceAlertService,
  calculateOverallComplianceScore
} from './complianceService';
import { getComplianceSummary } from './complianceUtils';

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

      const [complianceTracking, alertData] = await Promise.all([
        fetchComplianceTracking(profile.hospital_id),
        fetchComplianceAlerts(profile.hospital_id)
      ]);

      setComplianceData(complianceTracking);
      setAlerts(alertData);
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
      await updateComplianceStatusService(
        complianceId,
        status,
        profile?.id,
        score,
        violations,
        correctiveActions
      );

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
      await resolveComplianceAlertService(alertId, profile?.id);

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
      return await calculateOverallComplianceScore(profile.hospital_id);
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 0;
    }
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
    summary: getComplianceSummary(complianceData, alerts)
  };
};
