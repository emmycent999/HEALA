
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Bell, TrendingUp, Activity } from 'lucide-react';
import { HospitalAnalytics } from './HospitalAnalytics';
import { HospitalNotificationCenter } from './HospitalNotificationCenter';
import { HospitalOperationsManagement } from './HospitalOperationsManagement';
import { HospitalOverview } from './HospitalOverview';

interface DashboardStats {
  total_physicians: number;
  active_physicians: number;
  total_appointments: number;
  today_appointments: number;
  total_patients: number;
  emergency_requests: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

interface HospitalDashboardTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: DashboardStats;
}

export const HospitalDashboardTabs: React.FC<HospitalDashboardTabsProps> = ({
  activeTab,
  setActiveTab,
  stats
}) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="operations" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Operations
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <HospitalOverview />
      </TabsContent>

      <TabsContent value="analytics">
        <HospitalAnalytics />
      </TabsContent>

      <TabsContent value="operations">
        <HospitalOperationsManagement />
      </TabsContent>

      <TabsContent value="notifications">
        <HospitalNotificationCenter />
      </TabsContent>
    </Tabs>
  );
};
