
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HospitalOverview } from '@/components/hospital/HospitalOverview';
import { PhysicianManagement } from '@/components/hospital/PhysicianManagement';
import { AppointmentManagement } from '@/components/hospital/AppointmentManagement';
import { EmergencyCoordination } from '@/components/hospital/EmergencyCoordination';
import { Logo } from '@/components/ui/logo';

const HospitalDashboard = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/")}
                className="text-purple-600"
              >
                ← Back
              </Button>
              <Logo size="md" />
              <h1 className="text-xl font-bold text-purple-800">Hospital Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Hospital Admin</Badge>
              <span className="text-sm text-gray-600">
                {profile?.first_name} {profile?.last_name}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Hospital Management Dashboard
          </h2>
          <p className="text-gray-600">Manage physicians, monitor activity, and track performance</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="physicians">Physicians</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HospitalOverview />
          </TabsContent>

          <TabsContent value="physicians" className="space-y-6">
            <PhysicianManagement />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <AppointmentManagement />
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyCoordination />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Analytics features coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HospitalDashboard;
