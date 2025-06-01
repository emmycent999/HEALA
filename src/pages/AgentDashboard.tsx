
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { PatientLookup } from '@/components/agent/PatientLookup';
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking';
import { TransportBooking } from '@/components/agent/TransportBooking';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AgentChatInterface } from '@/components/agent/AgentChatInterface';
import { DashboardHeader } from '@/components/DashboardHeader';

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
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handlePatientFound = (patient: PatientInfo) => {
    setSelectedPatient(patient);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Agent Dashboard" />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lookup">Patient Lookup</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="lookup">
            <PatientLookup onPatientFound={handlePatientFound} />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Booking for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong> 
                  ({selectedPatient.email})
                </p>
              </div>
            )}
            <AppointmentBooking patientId={selectedPatient?.id} />
          </TabsContent>

          <TabsContent value="transport" className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Transport for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                </p>
              </div>
            )}
            <TransportBooking patientId={selectedPatient?.id} />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            {selectedPatient && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Emergency for: <strong>{selectedPatient.first_name} {selectedPatient.last_name}</strong>
                </p>
              </div>
            )}
            <EmergencyRequest patientId={selectedPatient?.id} />
          </TabsContent>

          <TabsContent value="chat">
            <AgentChatInterface />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
