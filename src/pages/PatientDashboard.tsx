
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MessageCircle, Ambulance, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppointmentBooking } from '@/components/appointments/AppointmentBooking';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AIHealthBot } from '@/components/chat/AIHealthBot';
import { EmergencyRequest } from '@/components/emergency/EmergencyRequest';
import { Logo } from '@/components/ui/logo';

const PatientDashboard = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-bold text-purple-800">Patient Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {profile.first_name || 'Patient'}
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
            Welcome to Your Health Dashboard
          </h2>
          <p className="text-gray-600">Manage appointments, chat with AI, and access emergency services</p>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="chat">AI Health Chat</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AppointmentBooking />
              <AppointmentList />
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AIHealthBot />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat with Physicians
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Connect with licensed physicians for consultations and medical advice.
                  </p>
                  <Button className="w-full">
                    Start Physician Chat
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <EmergencyRequest />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="font-medium">Name: </span>
                    <span>{profile.first_name} {profile.last_name}</span>
                  </div>
                  <div>
                    <span className="font-medium">Email: </span>
                    <span>{profile.email}</span>
                  </div>
                  <div>
                    <span className="font-medium">Phone: </span>
                    <span>{profile.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Subscription Plan: </span>
                    <span className="capitalize">{profile.subscription_plan || 'Basic'}</span>
                  </div>
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
