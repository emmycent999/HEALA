
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { PatientLookup } from '@/components/agent/PatientLookup';
import { AssistedPatients } from '@/components/agent/AssistedPatients';
import { FixedTransportBooking } from '@/components/agent/FixedTransportBooking';
import { AppointmentBooking } from '@/components/agent/AppointmentBooking';
import { EnhancedAgentChatInterface } from '@/components/agent/EnhancedAgentChatInterface';
import { AgentSettings } from '@/components/agent/AgentSettings';

const AgentDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';

  const renderContent = () => {
    switch (activeTab) {
      case 'patient-lookup':
        return <PatientLookup />;
      case 'assisted-patients':
        return <AssistedPatients />;
      case 'transport-booking':
        return <FixedTransportBooking />;
      case 'appointment-booking':
        return <AppointmentBooking />;
      case 'chat':
        return <EnhancedAgentChatInterface />;
      case 'settings':
        return <AgentSettings />;
      default:
        return <DynamicOverview />;
    }
  };

  return (
    <DashboardLayout title="Agent Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AgentDashboard;
