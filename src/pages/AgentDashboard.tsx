
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AssistedPatients } from '@/components/agent/AssistedPatients';
import { AppointmentBookingAgent } from '@/components/agent/AppointmentBooking';
import { TransportBooking } from '@/components/agent/TransportBooking';
import { DynamicOverview } from '@/components/agent/DynamicOverview';
import { Logo } from '@/components/ui/logo';

const AgentDashboard = () => {
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
              <h1 className="text-xl font-bold text-purple-800">Agent Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Agent</Badge>
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
            Agent Dashboard
          </h2>
          <p className="text-gray-600">Assist patients with appointments, transportation, and healthcare access</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Assisted Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <AssistedPatients />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <AppointmentBookingAgent />
          </TabsContent>

          <TabsContent value="transport" className="space-y-6">
            <TransportBooking />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
