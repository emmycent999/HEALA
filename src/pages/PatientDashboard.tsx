import React, { useState, useEffect } from 'react';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { AmbulanceStatus } from '@/components/emergency/AmbulanceStatus';
import { ProfileEditor } from '@/components/patient/ProfileEditor';
import { PatientProfile } from '@/components/patient/PatientProfile';
import { TransportManagement } from '@/components/patient/TransportManagement';
import { EmergencyManagement } from '@/components/patient/EmergencyManagement';
import { PatientSettings } from '@/components/patient/PatientSettings';
import { PhysicianAssignment } from '@/components/patient/PhysicianAssignment';
import { UniversalBotpress } from '@/components/shared/UniversalBotpress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGlobalSessionMonitor } from '@/components/consultation/hooks/useGlobalSessionMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

// Enhanced components
import { EnhancedAppointmentBooking } from '@/components/enhanced-appointments/EnhancedAppointmentBooking';
import { PrescriptionManagement } from '@/components/prescriptions/PrescriptionManagement';
import { HealthRecordsAccess } from '@/components/health-records/HealthRecordsAccess';
import { MedicalHistoryUpload } from '@/components/medical-history/MedicalHistoryUpload';
import { SymptomChecker } from '@/components/symptom-checker/SymptomChecker';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';
import { EmergencyContacts } from '@/components/emergency/EmergencyContacts';
import { OfflineManager } from '@/components/offline/OfflineManager';
import { DigitalWallet } from '@/components/wallet/DigitalWallet';
import { VirtualConsultationRoom } from '@/components/consultation/VirtualConsultationRoom';

const PatientDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const { user } = useAuth();

  // Set up global session monitoring for auto-redirect
  const { activeSessions, isMonitoring, lastUpdate, manualSessionCheck } = useGlobalSessionMonitor({
    isEnabled: true, // Always monitor for patients
    onSessionStarted: (sessionId: string) => {
      console.log('🎯 [PatientDashboard] Session started callback triggered:', sessionId);
    }
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('Current tab from URL:', tab);
    
    // If no tab is specified, redirect to appointments tab
    if (!tab) {
      console.log('No tab specified, redirecting to appointments');
      navigate('/patient?tab=appointments', { replace: true });
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, navigate]);

  console.log('Rendering PatientDashboard with activeTab:', activeTab, 'Monitoring:', isMonitoring, 'Active sessions:', activeSessions);

  const renderContent = () => {
    switch (activeTab) {
      case 'appointments':
        return (
          <div className="space-y-6">
            {/* Enhanced Debug Panel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-3">🔍 Session Monitor Debug Panel</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-blue-700">Monitoring Status:</span>
                  <span className={`${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
                    {isMonitoring ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-700">Active Sessions:</span>
                  <span className="text-blue-600">{activeSessions.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-700">Last Update:</span>
                  <span className="text-blue-600 text-xs">{lastUpdate.toLocaleTimeString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-blue-700">Actions:</span>
                  <Button size="sm" onClick={manualSessionCheck} className="mt-1">
                    🔄 Check Now
                  </Button>
                </div>
              </div>
              {activeSessions.length > 0 && (
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                  <div className="font-medium text-blue-800 mb-1">Active Sessions:</div>
                  {activeSessions.map(s => (
                    <div key={s.id} className="text-blue-700">
                      📍 {s.id.slice(0, 8)}... - Status: <span className="font-medium">{s.status}</span>
                      {s.status === 'in_progress' && (
                        <span className="ml-2 text-green-600 font-bold animate-pulse">🔴 LIVE</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Book New Appointment</h3>
                <EnhancedAppointmentBooking />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-white">My Appointments</h3>
                <AppointmentList />
              </div>
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Digital Wallet
            </h2>
            <DigitalWallet />
          </div>
        );
      case 'virtual-consultation':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Virtual Consultation Room
            </h2>
            <VirtualConsultationRoom sessionId={searchParams.get('session')} />
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
      case 'prescriptions':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Prescription Management
            </h2>
            <PrescriptionManagement />
          </div>
        );
      case 'health-records':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Health Records
              </h2>
              <HealthRecordsAccess />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upload Medical History
              </h3>
              <MedicalHistoryUpload />
            </div>
          </div>
        );
      case 'symptom-checker':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Symptom Checker
            </h2>
            <SymptomChecker />
          </div>
        );
      case 'emergency-contacts':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Emergency Contacts
            </h2>
            <EmergencyContacts />
          </div>
        );
      case 'accessibility':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Accessibility Settings
            </h2>
            <AccessibilitySettings />
          </div>
        );
      case 'offline':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Offline Access
            </h2>
            <OfflineManager />
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
        return <PatientSettings />;
      case 'ambulance':
        return <AmbulanceStatus />;
      default:
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              Tab "{activeTab}" not found
            </h3>
            <p className="mt-2 text-gray-500">Please select a valid tab from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout title="Patient Dashboard">
      {/* Global monitoring status indicator */}
      {isMonitoring && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700 font-medium">
              🔴 Live monitoring for consultation updates...
            </span>
            {activeSessions.length > 0 && (
              <span className="text-xs text-green-600">
                ({activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      )}
      
      {renderContent()}
    </DashboardLayout>
  );
};

export default PatientDashboard;
