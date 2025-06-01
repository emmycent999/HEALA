
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { PatientManagement } from '@/components/physician/PatientManagement';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { DashboardHeader } from '@/components/DashboardHeader';

const PhysicianDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [chatPatientId, setChatPatientId] = useState<string>('');
  const [chatPatientName, setChatPatientName] = useState<string>('');

  const handleStartChat = (patientId: string, patientName: string) => {
    setChatPatientId(patientId);
    setChatPatientName(patientName);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">My Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chat">Patient Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="patients">
            <PatientManagement onStartChat={handleStartChat} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentList />
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface 
              conversationId={chatPatientId}
              title={chatPatientName ? `Chat with ${chatPatientName}` : 'Patient Chat'}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PhysicianDashboard;
