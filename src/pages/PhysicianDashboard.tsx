
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { PatientManagement } from '@/components/physician/PatientManagement';
import { PhysicianProfile } from '@/components/physician/PhysicianProfile';
import { PhysicianChatInterface } from '@/components/physician/PhysicianChatInterface';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { DashboardHeader } from '@/components/DashboardHeader';

const PhysicianDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const handleStartChat = (conversationId: string, patientName: string) => {
    setSelectedConversation(conversationId);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader title="Physician Dashboard" />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">My Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chat">Communication</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
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
            <PhysicianChatInterface />
          </TabsContent>

          <TabsContent value="profile">
            <PhysicianProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PhysicianDashboard;
