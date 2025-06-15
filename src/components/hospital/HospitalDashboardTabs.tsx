
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Search } from 'lucide-react';
import { HospitalOverview } from './HospitalOverview';
import { PhysicianManagement } from './PhysicianManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { HospitalPhysicianAssignment } from './HospitalPhysicianAssignment';
import { HospitalProfileManagement } from './HospitalProfileManagement';
import { HospitalEmergencyManagement } from './HospitalEmergencyManagement';
import { HospitalFinancialManagement } from './HospitalFinancialManagement';
import { HospitalSecurityManagement } from './HospitalSecurityManagement';
import { HospitalComplianceManagement } from './HospitalComplianceManagement';
import { HospitalDocumentManagement } from './HospitalDocumentManagement';
import { HospitalIntegrationManagement } from './HospitalIntegrationManagement';
import { HospitalAdvancedSettings } from './HospitalAdvancedSettings';

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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-12">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="physicians">Physicians</TabsTrigger>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="patients">Patients</TabsTrigger>
        <TabsTrigger value="emergency">Emergency</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <HospitalOverview />
      </TabsContent>

      <TabsContent value="physicians">
        <div className="space-y-6">
          <PhysicianManagement />
          <Card>
            <CardHeader>
              <CardTitle>Assign External Physicians</CardTitle>
            </CardHeader>
            <CardContent>
              <HospitalPhysicianAssignment />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="appointments">
        <AppointmentManagement />
      </TabsContent>

      <TabsContent value="patients">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Patient Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.total_patients}</div>
                    <div className="text-sm text-gray-600">Total Patients</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.floor(stats.total_patients * 0.7)}
                    </div>
                    <div className="text-sm text-gray-600">Returning Patients</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.floor(stats.total_patients * 0.3)}
                    </div>
                    <div className="text-sm text-gray-600">New Patients</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Patient management features coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="emergency">
        <HospitalEmergencyManagement />
      </TabsContent>

      <TabsContent value="financial">
        <HospitalFinancialManagement />
      </TabsContent>

      <TabsContent value="security">
        <HospitalSecurityManagement />
      </TabsContent>

      <TabsContent value="compliance">
        <HospitalComplianceManagement />
      </TabsContent>

      <TabsContent value="documents">
        <HospitalDocumentManagement />
      </TabsContent>

      <TabsContent value="integrations">
        <HospitalIntegrationManagement />
      </TabsContent>

      <TabsContent value="advanced">
        <HospitalAdvancedSettings />
      </TabsContent>

      <TabsContent value="settings">
        <HospitalProfileManagement />
      </TabsContent>
    </Tabs>
  );
};
