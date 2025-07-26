
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentsTab } from './AppointmentsTab';
import { WalletTab } from './WalletTab';
import { VirtualConsultationTab } from './VirtualConsultationTab';
import { EmergencyTab } from './EmergencyTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { AIAssistantTab } from './AIAssistantTab';
import { SubscriptionTab } from './SubscriptionTab';
import { ProfileTab } from './ProfileTab';
import { SymptomChecker } from '@/components/symptom-checker/SymptomChecker';
import { PatientDashboardTab } from './types';

interface PatientDashboardContentProps {
  activeTab?: PatientDashboardTab;
}

export const PatientDashboardContent: React.FC<PatientDashboardContentProps> = ({ 
  activeTab = 'appointments'
}) => {
  const { profile } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentsTab />;
      case 'wallet':
        return <WalletTab />;
      case 'virtual-consultation':
        return <VirtualConsultationTab />;
      case 'emergency':
        return <EmergencyTab />;
      case 'health-records':
        return <HealthRecordsTab />;
      case 'prescriptions':
        return <PrescriptionsTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      case 'subscription':
        return <SubscriptionTab />;
      case 'profile':
        return <ProfileTab />;
      case 'symptom-checker':
        return <SymptomChecker />;
      case 'chat':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Chat functionality is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'emergency-contacts':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Emergency contacts management is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'contact-agent':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Contact Agent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Agent contact features are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'physician':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Physician</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Physician features are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'transport':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transport</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Transport booking is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'accessibility':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Accessibility settings are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'offline':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Offline Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Offline features are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'ambulance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Ambulance Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ambulance services are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      default:
        return <AppointmentsTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {getWelcomeMessage()}, {profile?.first_name || 'Patient'}!
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                How can we help you with your health today?
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {profile?.subscription_plan || 'Basic'} Plan
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Dynamic Content Based on Active Tab */}
      {renderTabContent()}
    </div>
  );
};
