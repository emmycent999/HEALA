
import React, { useState, useEffect } from 'react';
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
import { PhysicianAssignment } from '@/components/patient/PhysicianAssignment';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams } from 'react-router-dom';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'appointments');

  useEffect(() => {
    const tab = searchParams.get('tab') || 'appointments';
    setActiveTab(tab);
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
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
        );
      case 'chat':
        return <ChatInterface />;
      case 'ai-assistant':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                AI Health Assistant
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant health guidance and support from our AI assistant
              </p>
            </div>
            <UniversalBotpress />
          </div>
        );
      case 'physician':
        return <PhysicianAssignment />;
      case 'emergency':
        return (
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
        );
      case 'profile':
        return (
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
        );
      case 'transport':
        return <TransportManagement />;
      case 'subscription':
        return <SubscriptionUpgrade />;
      case 'ambulance':
        return <AmbulanceStatus />;
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <DashboardLayout title="Patient Dashboard">
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;
