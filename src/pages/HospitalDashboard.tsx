
import React from 'react';
import { SecureHospitalDashboard } from '@/components/hospital/SecureHospitalDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const HospitalDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  return (
    <DashboardLayout title="Hospital Dashboard">
      <SecureHospitalDashboard />
    </DashboardLayout>
  );
};

export default HospitalDashboard;
