
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AmbulanceStatus } from '@/components/emergency/AmbulanceStatus';
import { ProfileEditor } from '@/components/patient/ProfileEditor';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { TransportManagement } from '@/components/patient/TransportManagement';
import { EmergencyManagement } from '@/components/patient/EmergencyManagement';
import { SubscriptionUpgrade } from '@/components/patient/SubscriptionUpgrade';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useSearchParams } from 'react-router-dom';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'appointments';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader title="Patient Dashboard" />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chat">AI Health Chat</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="ambulance">Ambulance Status</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Book New Appointment</h3>
                <AppointmentBooking />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">My Appointments</h3>
                <AppointmentList />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <ChatInterface />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Request Emergency</h3>
                <EmergencyRequest />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">My Emergency Requests</h3>
                <EmergencyManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Basic Profile</h3>
                <PatientProfile />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Extended Profile</h3>
                <ProfileEditor />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transport">
            <TransportManagement />
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
