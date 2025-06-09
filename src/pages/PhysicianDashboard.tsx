
import React, { useState, useEffect } from 'react';
import { PatientList } from '@/components/physician/PatientList';
import { PhysicianChatInterface } from '@/components/physician/PhysicianChatInterface';
import { PhysicianProfile } from '@/components/physician/PhysicianProfile';
import { PhysicianDocumentUpload } from '@/components/physician/PhysicianDocumentUpload';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const PhysicianDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DynamicOverview />;
      case 'patients':
        return <PatientList patients={[]} onStartConversation={() => {}} />;
      case 'chat':
        return <PhysicianChatInterface />;
      case 'profile':
        return <PhysicianProfile />;
      case 'documents':
        return <PhysicianDocumentUpload />;
      default:
        return <DynamicOverview />;
    }
  };

  return (
    <DashboardLayout title="Physician Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default PhysicianDashboard;
