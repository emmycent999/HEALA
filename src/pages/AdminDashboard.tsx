
import React from 'react';
import { TestSuite } from '@/components/testing/TestSuite';
import { TestingGuide } from '@/components/testing/TestingGuide';
import { VerificationCenter } from '@/components/admin/VerificationCenter';
import { UserManagement } from '@/components/admin/UserManagement';
import { DocumentManagement } from '@/components/admin/DocumentManagement';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'analytics';

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <SystemAnalytics />;
      case 'verifications':
        return <VerificationCenter />;
      case 'users':
        return <UserManagement />;
      case 'documents':
        return <DocumentManagement />;
      case 'testing':
        return <TestingGuide />;
      case 'automated':
        return <TestSuite />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <DashboardLayout title="Admin Portal">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AdminDashboard;
