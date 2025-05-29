
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PhysicianRegistrationForm } from '@/components/physician/PhysicianRegistrationForm';
import { DynamicOverview } from '@/components/physician/DynamicOverview';
import { Logo } from '@/components/ui/logo';

const PhysicianDashboard = () => {
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
              <h1 className="text-xl font-bold text-purple-800">Physician Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Physician</Badge>
              <span className="text-sm text-gray-600">
                Dr. {profile?.first_name} {profile?.last_name}
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
            Physician Dashboard
          </h2>
          <p className="text-gray-600">Manage your practice, patients, and schedule</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <DynamicOverview />
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-gray-600">Patient management features coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="registration" className="space-y-6">
            <PhysicianRegistrationForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PhysicianDashboard;
