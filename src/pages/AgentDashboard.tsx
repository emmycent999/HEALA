
import React, { useState } from 'react';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { PatientLookup } from '@/components/agent/PatientLookup';
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking';
import { TransportBooking } from '@/components/agent/TransportBooking';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AgentChatInterface } from '@/components/agent/AgentChatInterface';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
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
}

const AgentDashboard = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);

  const handlePatientFound = (patient: PatientInfo) => {
    setSelectedPatient(patient);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DynamicOverview />;
      case 'lookup':
        return <PatientLookup onPatientFound={handlePatientFound} />;
      case 'appointments':
        return (
          <div className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Booking for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> 
                  ({selectedPatient.email})
                </p>
              </div>
            )}
            <AppointmentBooking patientId={selectedPatient?.id} />
          </div>
        );
      case 'transport':
        return (
          <div className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Transport for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                </p>
              </div>
            )}
            <TransportBooking patientId={selectedPatient?.id} />
          </div>
        );
      case 'emergency':
        return (
          <div className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Emergency for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                </p>
              </div>
            )}
            <EmergencyRequest patientId={selectedPatient?.id} />
          </div>
        );
      case 'chat':
        return <AgentChatInterface />;
      case 'ai-assistant':
        return <UniversalBotpress />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <DashboardLayout title="Agent Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default AgentDashboard;
