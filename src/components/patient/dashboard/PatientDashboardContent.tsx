
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  FileText, 
  Pill, 
  AlertTriangle, 
  Bot, 
  User, 
  Wallet,
  Settings
} from 'lucide-react';
import { AppointmentsTab } from './AppointmentsTab';
import { VirtualConsultationTab } from './VirtualConsultationTab';
import { HealthRecordsTab } from './HealthRecordsTab';
import { PrescriptionsTab } from './PrescriptionsTab';
import { EmergencyTab } from './EmergencyTab';
import { AIAssistantTab } from './AIAssistantTab';
import { ProfileTab } from './ProfileTab';
import { WalletTab } from './WalletTab';
import { PatientDashboardTab } from './types';

interface PatientDashboardContentProps {
  activeTab: PatientDashboardTab;
}

export const PatientDashboardContent: React.FC<PatientDashboardContentProps> = ({ activeTab }) => {
  const navigate = useNavigate();

  const handleTabChange = (tab: string) => {
    navigate(`/patient?tab=${tab}`);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 gap-1 h-auto p-1">
          <TabsTrigger 
            value="appointments" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="virtual-consultation" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Consultation</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="health-records" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Records</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="prescriptions" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Pill className="w-4 h-4" />
            <span className="hidden sm:inline">Prescriptions</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="emergency" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Emergency</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="ai-assistant" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">AI Assistant</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="profile" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="wallet" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Wallet</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="accessibility" 
            className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="appointments" className="space-y-4">
            <AppointmentsTab />
          </TabsContent>

          <TabsContent value="virtual-consultation" className="space-y-4">
            <VirtualConsultationTab />
          </TabsContent>

          <TabsContent value="health-records" className="space-y-4">
            <HealthRecordsTab />
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-4">
            <PrescriptionsTab />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-4">
            <EmergencyTab />
          </TabsContent>

          <TabsContent value="ai-assistant" className="space-y-4">
            <AIAssistantTab />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <WalletTab />
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-4">
            <div className="text-center text-gray-500">
              Accessibility settings coming soon...
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
