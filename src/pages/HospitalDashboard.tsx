
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Heart, Settings, Bell, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(7);

  const hospitalStats = [
    { label: "Total Patients", value: "2,847", change: "+15%" },
    { label: "Active Physicians", value: "127", change: "+3%" },
    { label: "Today's Appointments", value: "156", change: "+8%" },
    { label: "Bed Occupancy", value: "78%", change: "-2%" }
  ];

  const departments = [
    { name: "Emergency", patients: 23, doctors: 8, status: "busy" },
    { name: "Cardiology", patients: 45, doctors: 12, status: "normal" },
    { name: "Pediatrics", patients: 32, doctors: 9, status: "normal" },
    { name: "Surgery", patients: 18, doctors: 15, status: "busy" },
    { name: "Oncology", patients: 28, doctors: 7, status: "normal" }
  ];

  const recentActivity = [
    { id: 1, action: "New patient admission - Emergency", time: "5 min ago", type: "admission" },
    { id: 2, action: "Dr. Smith completed surgery", time: "15 min ago", type: "completion" },
    { id: 3, action: "Equipment maintenance scheduled", time: "1 hour ago", type: "maintenance" },
    { id: 4, action: "New physician onboarded", time: "2 hours ago", type: "staff" }
  ];

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
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-purple-800">Heala - Hospital Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {notifications}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Hospital Overview</h2>
          <p className="text-gray-600">Monitor and manage hospital operations in real-time</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {hospitalStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <span className={`text-sm ${stat.change.includes('+') ? 'text-green-600' : stat.change.includes('-') ? 'text-red-600' : 'text-gray-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Overview</CardTitle>
                <CardDescription>Real-time status of hospital departments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {departments.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{dept.name}</h4>
                        <p className="text-sm text-gray-600">
                          {dept.patients} patients • {dept.doctors} doctors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={dept.status === 'busy' ? 'destructive' : 'default'}
                        className={dept.status === 'normal' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {dept.status}
                      </Badge>
                      <div className="mt-2">
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>Manage physicians, nurses, and hospital staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Active Staff</h4>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Add Staff</Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <h3 className="font-semibold">Physicians</h3>
                        <p className="text-2xl font-bold text-blue-600">127</p>
                        <p className="text-sm text-gray-600">+3 this month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <h3 className="font-semibold">Nurses</h3>
                        <p className="text-2xl font-bold text-green-600">284</p>
                        <p className="text-sm text-gray-600">+8 this month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold">Support Staff</h3>
                        <p className="text-2xl font-bold text-purple-600">156</p>
                        <p className="text-sm text-gray-600">+2 this month</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">92%</div>
                  <p className="text-sm text-gray-600">+1.5% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Average Wait Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-500">18 min</div>
                  <p className="text-sm text-gray-600">-3 min from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">$2.4M</div>
                  <p className="text-sm text-gray-600">+12% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Emergency Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">4.2 min</div>
                  <p className="text-sm text-gray-600">Average response time</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest hospital operations and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'admission' ? 'bg-blue-500' :
                          activity.type === 'completion' ? 'bg-green-500' :
                          activity.type === 'maintenance' ? 'bg-orange-500' :
                          'bg-purple-500'
                        }`} />
                        <span className="text-sm">{activity.action}</span>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HospitalDashboard;
