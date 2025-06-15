
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentsTab } from './AppointmentsTab';
import { VirtualConsultationTab } from './VirtualConsultationTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { EmergencyTab } from './EmergencyTab';
import { AIAssistantTab } from './AIAssistantTab';
import { ProfileTab } from './ProfileTab';
import { WalletTab } from './WalletTab';
import { SubscriptionTab } from './SubscriptionTab';
import { PatientDashboardTab } from './types';

interface PatientDashboardContentProps {
  activeTab: PatientDashboardTab;
}

export const PatientDashboardContent: React.FC<PatientDashboardContentProps> = ({ activeTab }) => {
  const navigate = useNavigate();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentsTab />;
      case 'virtual-consultation':
        return <VirtualConsultationTab />;
      case 'health-records':
        return <HealthRecordsTab />;
      case 'prescriptions':
        return <PrescriptionsTab />;
      case 'emergency':
        return <EmergencyTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      case 'profile':
        return <ProfileTab />;
      case 'wallet':
        return <WalletTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'accessibility':
        return (
          <div className="text-center text-gray-500">
            Accessibility settings coming soon...
          </div>
        );
      default:
        return <AppointmentsTab />;
    }
  };

  return (
    <div className="space-y-6">
      {renderTabContent()}
    </div>
  );
};
