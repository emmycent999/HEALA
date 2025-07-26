
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MessageSquare, 
  Video, 
  Wallet, 
  FileText, 
  User, 
  AlertTriangle, 
  Bot,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppointmentsTab } from './AppointmentsTab';
import { FixedVirtualConsultationTab } from './FixedVirtualConsultationTab';
import { FixedWalletTab } from './FixedWalletTab';
import { FixedEmergencyTab } from './FixedEmergencyTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { ProfileTab } from './ProfileTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { AIAssistantTab } from './AIAssistantTab';
import { SubscriptionTab } from './SubscriptionTab';

export const PatientDashboardContent: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('appointments');

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="consultation" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Virtual</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency</span>
          </TabsTrigger>
          <TabsTrigger value="health-records" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Records</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Rx</span>
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Help</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab />
        </TabsContent>

        <TabsContent value="consultation" className="mt-6">
          <FixedVirtualConsultationTab />
        </TabsContent>

        <TabsContent value="wallet" className="mt-6">
          <FixedWalletTab />
        </TabsContent>

        <TabsContent value="emergency" className="mt-6">
          <FixedEmergencyTab />
        </TabsContent>

        <TabsContent value="health-records" className="mt-6">
          <HealthRecordsTab />
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-6">
          <PrescriptionsTab />
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6">
          <AIAssistantTab />
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <SubscriptionTab />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
