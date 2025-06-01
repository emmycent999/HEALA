
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AmbulanceStatus } from '@/components/emergency/AmbulanceStatus';
import { ProfileEditor } from '@/components/patient/ProfileEditor';
import { SubscriptionUpgrade } from '@/components/patient/SubscriptionUpgrade';
import { DashboardHeader } from '@/components/DashboardHeader';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chat">AI Health Chat</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="ambulance">Ambulance Status</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Book New Appointment</h3>
                <AppointmentBooking />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">My Appointments</h3>
                <AppointmentList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyRequest />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileEditor />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionUpgrade />
          </TabsContent>

          <TabsContent value="ambulance">
            <AmbulanceStatus />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
