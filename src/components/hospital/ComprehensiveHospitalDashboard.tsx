
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Building } from 'lucide-react';
import { useHospitalData } from './hooks/useHospitalData';
import { HospitalDashboardHeader } from './HospitalDashboardHeader';
import { HospitalDashboardStats } from './HospitalDashboardStats';
import { HospitalDashboardTabs } from './HospitalDashboardTabs';

export const ComprehensiveHospitalDashboard: React.FC = () => {
  const { hospitalInfo, stats, loading, profile } = useHospitalData();
  const [activeTab, setActiveTab] = useState('overview');

  if (profile?.role !== 'hospital_admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the hospital dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile?.hospital_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">No Hospital Assignment</h3>
          <p className="text-gray-600">Your account is not associated with any hospital. Please contact an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="p-6">Loading hospital dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <HospitalDashboardHeader hospitalInfo={hospitalInfo} />
      <HospitalDashboardStats stats={stats} />
      <HospitalDashboardTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats} 
      />
    </div>
  );
};
