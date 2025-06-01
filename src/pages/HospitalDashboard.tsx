
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HospitalOverview } from '@/components/hospital/HospitalOverview';
import { PhysicianManagement } from '@/components/hospital/PhysicianManagement';
import { AppointmentManagement } from '@/components/hospital/AppointmentManagement';
import { EmergencyCoordination } from '@/components/hospital/EmergencyCoordination';
import { HospitalAnalytics } from '@/components/hospital/HospitalAnalytics';
import { DashboardHeader } from '@/components/DashboardHeader';

const HospitalDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Hospital Dashboard" />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="physicians">Physicians</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <HospitalOverview />
          </TabsContent>

          <TabsContent value="physicians">
            <PhysicianManagement />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentManagement />
          </TabsContent>

          <TabsContent value="emergency">
            <EmergencyCoordination />
          </TabsContent>

          <TabsContent value="analytics">
            <HospitalAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HospitalDashboard;
