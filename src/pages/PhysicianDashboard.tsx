
import React, { useState, useEffect } from 'react';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { PatientManagement } from '@/components/physician/PatientManagement';
import { PhysicianProfile } from '@/components/physician/PhysicianProfile';
import { PhysicianChatInterface } from '@/components/physician/PhysicianChatInterface';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const PhysicianDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const handleStartChat = (conversationId: string, patientName: string) => {
    setSelectedConversation(conversationId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DynamicOverview />;
      case 'patients':
        return <PatientManagement onStartChat={handleStartChat} />;
      case 'appointments':
        return <AppointmentList />;
      case 'chat':
        return <PhysicianChatInterface />;
      case 'ai-assistant':
        return <UniversalBotpress />;
      case 'profile':
        return <PhysicianProfile />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <DashboardLayout title="Physician Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default PhysicianDashboard;
