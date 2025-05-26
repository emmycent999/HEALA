
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Users, Heart, Bell, Settings, User, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PhysicianRegistration } from "@/components/physician/PhysicianRegistration";

const PhysicianDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(5);

  const todaysAppointments = [
    {
      id: 1,
      patient: "John Smith",
      time: "9:00 AM",
      type: "Consultation",
      status: "confirmed",
      duration: "30 min"
    },
    {
      id: 2,
      patient: "Maria Garcia",
      time: "10:30 AM",
      type: "Follow-up",
      status: "confirmed",
      duration: "15 min"
    },
    {
      id: 3,
      patient: "David Wilson",
      time: "2:00 PM",
      type: "Check-up",
      status: "pending",
      duration: "45 min"
    }
  ];

  const patientStats = [
    { label: "Total Patients", value: "1,247", change: "+12%" },
    { label: "Today's Appointments", value: "8", change: "0%" },
    { label: "Pending Reviews", value: "23", change: "+5%" },
    { label: "Emergency Cases", value: "2", change: "-50%" }
  ];

  const performanceMetrics = [
    { label: "Patient Satisfaction", value: "94%", trend: "+2%" },
    { label: "Appointment Completion", value: "98%", trend: "0%" },
    { label: "Response Time", value: "3.2 min", trend: "-15%" },
    { label: "Cases This Month", value: "156", trend: "+8%" }
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
              <h1 className="text-xl font-bold text-purple-800">Heala - Physician Portal</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Good morning, Dr. Johnson!</h2>
          <p className="text-gray-600">You have 8 appointments scheduled for today</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {patientStats.map((stat, index) => (
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

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="appointments">Today's Schedule</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="registration">Profile</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
                <CardDescription>Your scheduled consultations for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{appointment.patient}</h4>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.time} • {appointment.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                        className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {appointment.status}
                      </Badge>
                      <div className="mt-2 space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Start</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>Search and manage your patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Recent Patients</h4>
                    <Button size="sm" variant="outline">View All</Button>
                  </div>
                  <div className="space-y-3">
                    {['John Smith', 'Maria Garcia', 'David Wilson', 'Sarah Brown'].map((patient, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{patient}</p>
                            <p className="text-sm text-gray-600">Last visit: {index + 1} days ago</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">View Records</Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Consultations</CardTitle>
                <CardDescription>Ongoing and scheduled video consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active consultations</h3>
                  <p className="text-gray-600 mb-4">Your next consultation starts at 9:00 AM</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">Start Consultation</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Your professional performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {performanceMetrics.map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">{metric.label}</p>
                            <p className="text-2xl font-bold">{metric.value}</p>
                          </div>
                          <span className={`text-sm ${metric.trend.includes('+') ? 'text-green-600' : metric.trend.includes('-') ? 'text-red-600' : 'text-gray-600'}`}>
                            {metric.trend}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="registration" className="space-y-4">
            <PhysicianRegistration />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">94%</div>
                  <p className="text-sm text-gray-600">+2% from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Appointment Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">98%</div>
                  <p className="text-sm text-gray-600">Excellent performance</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PhysicianDashboard;
