
import React, { useState, useEffect } from 'react';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { PatientLookup } from '@/components/agent/PatientLookup';
import { AssistedPatients } from '@/components/agent/AssistedPatients';
import { TransportBooking } from '@/components/agent/TransportBooking';
import { AppointmentBooking } from '@/components/agent/AppointmentBooking';
import { AgentChatInterface } from '@/components/agent/AgentChatInterface';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  role: string;
}

const AgentDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  const handlePatientFound = (patient: PatientInfo) => {
    setSelectedPatient(patient);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DynamicOverview />;
      case 'patient-lookup':
        return <PatientLookup onPatientFound={handlePatientFound} />;
      case 'assisted-patients':
        return <AssistedPatients />;
      case 'transport-booking':
        return <TransportBooking selectedPatient={selectedPatient} />;
      case 'appointment-booking':
        return <AppointmentBooking selectedPatient={selectedPatient} />;
      case 'chat':
        return <AgentChatInterface selectedPatient={selectedPatient} />;
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
