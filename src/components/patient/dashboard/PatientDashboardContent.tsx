
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentsTab } from './AppointmentsTab';
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

  // Render different content based on activeTab from URL
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentsTab />;
      case 'wallet':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Wallet functionality is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'virtual-consultation':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Virtual Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Virtual consultation features are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'emergency':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Emergency Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Emergency services are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'health-records':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Health Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Health records management is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'prescriptions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Prescription management is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'ai-assistant':
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                AI assistance features are available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'subscription':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Subscription management is available through the sidebar navigation.
              </p>
            </CardContent>
          </Card>
        );
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Profile settings are available through the sidebar navigation.
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
