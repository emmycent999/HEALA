
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TestSuite } from '@/components/testing/TestSuite';
import { TestingGuide } from '@/components/testing/TestingGuide';
import { VerificationCenter } from '@/components/admin/VerificationCenter';
import { UserManagement } from '@/components/admin/UserManagement';
import { DocumentManagement } from '@/components/admin/DocumentManagement';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { Logo } from '@/components/ui/logo';

const AdminDashboard = () => {
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
              <h1 className="text-xl font-bold text-purple-800">Admin Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Admin</Badge>
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
            Admin Dashboard
          </h2>
          <p className="text-gray-600">Manage system registrations, verifications, and monitor application health</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="automated">Test Suite</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <SystemAnalytics />
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <VerificationCenter />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <DocumentManagement />
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <TestingGuide />
          </TabsContent>

          <TabsContent value="automated" className="space-y-4">
            <TestSuite />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
