
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Activity, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">47</div>
                    <div className="text-sm text-gray-600">Active Physicians</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-gray-600">Today's Appointments</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-gray-600">Capacity Utilization</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-gray-600">New Patients Today</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { dept: 'Emergency', patients: 23, status: 'High' },
                      { dept: 'Cardiology', patients: 15, status: 'Normal' },
                      { dept: 'Orthopedics', patients: 18, status: 'Normal' },
                      { dept: 'Pediatrics', patients: 12, status: 'Low' }
                    ].map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{dept.dept}</div>
                          <div className="text-sm text-gray-600">{dept.patients} patients</div>
                        </div>
                        <Badge variant={dept.status === 'High' ? 'destructive' : dept.status === 'Normal' ? 'default' : 'secondary'}>
                          {dept.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Emergency Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded border-red-200 bg-red-50">
                      <div className="font-medium text-red-800">Cardiac Emergency</div>
                      <div className="text-sm text-red-600">Downtown area - ETA 8 minutes</div>
                      <Badge variant="destructive" className="mt-1">Active</Badge>
                    </div>
                    <div className="p-3 border rounded">
                      <div className="font-medium">Medical Transport</div>
                      <div className="text-sm text-gray-600">Elderly patient - Non-urgent</div>
                      <Badge variant="secondary" className="mt-1">Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="physicians" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Physician Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Dr. Sarah Johnson', specialty: 'Cardiology', status: 'Active', patients: 23 },
                    { name: 'Dr. Michael Chen', specialty: 'Emergency Medicine', status: 'On Duty', patients: 15 },
                    { name: 'Dr. Emily Davis', specialty: 'Pediatrics', status: 'Active', patients: 18 },
                    { name: 'Dr. Robert Wilson', specialty: 'Orthopedics', status: 'Off Duty', patients: 0 }
                  ].map((physician, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{physician.name}</div>
                        <div className="text-sm text-gray-600">{physician.specialty}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="font-medium">{physician.patients}</div>
                          <div className="text-xs text-gray-500">Patients</div>
                        </div>
                        <Badge variant={physician.status === 'Active' || physician.status === 'On Duty' ? 'default' : 'secondary'}>
                          {physician.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Appointment scheduling and management features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hospital Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">87%</div>
                    <div className="text-sm text-gray-600">Patient Satisfaction</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1,234</div>
                    <div className="text-sm text-gray-600">Monthly Patients</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">4.2</div>
                    <div className="text-sm text-gray-600">Avg. Wait Time (hrs)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Emergency service coordination features will be implemented here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HospitalDashboard;
