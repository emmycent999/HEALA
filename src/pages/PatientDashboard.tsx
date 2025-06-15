
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGlobalSessionMonitor } from '@/components/consultation/hooks/useGlobalSessionMonitor';
import { PatientDashboardContent } from '@/components/patient/dashboard/PatientDashboardContent';
import { PatientDashboardTab } from '@/components/patient/dashboard/types';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PatientDashboardTab>('appointments');

  // Set up global session monitoring for auto-redirect
  const { activeSessions, isMonitoring, lastUpdate, manualSessionCheck } = useGlobalSessionMonitor({
    isEnabled: true, // Always monitor for patients
    onSessionStarted: (sessionId: string) => {
      console.log('🎯 [PatientDashboard] Session started callback triggered:', sessionId);
    }
  });

  useEffect(() => {
    const tab = searchParams.get('tab') as PatientDashboardTab;
    console.log('Current tab from URL:', tab);
    
    // If no tab is specified, redirect to appointments tab
    if (!tab) {
      console.log('No tab specified, redirecting to appointments');
      navigate('/patient?tab=appointments', { replace: true });
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, navigate]);

  console.log('Rendering PatientDashboard with activeTab:', activeTab, 'Monitoring:', isMonitoring, 'Active sessions:', activeSessions);

  return (
    <DashboardLayout title="Patient Dashboard">
      {/* Global monitoring status indicator */}
      {isMonitoring && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              🔴 Live monitoring for consultation updates...
            </span>
            {activeSessions.length > 0 && (
              <span className="text-xs text-green-600">
                ({activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      )}
      
      <PatientDashboardContent activeTab={activeTab} />
    </DashboardLayout>
  );
};

export default PatientDashboard;
