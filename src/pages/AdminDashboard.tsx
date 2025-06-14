
import React, { useState, useEffect } from 'react';
import { EnhancedAdminDashboard } from '@/components/admin/EnhancedAdminDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'users');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'users';
    setActiveTab(tab);
  }, [searchParams]);

  return (
    <DashboardLayout title="Admin Dashboard">
      <EnhancedAdminDashboard />
    </DashboardLayout>
  );
};

export default AdminDashboard;
