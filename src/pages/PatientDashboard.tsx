
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Heart, User, Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(3);

  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "Cardiologist",
      date: "Today",
      time: "2:30 PM",
      type: "Follow-up",
      status: "confirmed"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "General Practice",
      date: "Tomorrow",
      time: "10:00 AM",
      type: "Consultation",
      status: "pending"
    }
  ];

  const recentActivity = [
    { id: 1, action: "Appointment booked with Dr. Johnson", time: "2 hours ago" },
    { id: 2, action: "Lab results uploaded", time: "1 day ago" },
    { id: 3, action: "Prescription refill requested", time: "3 days ago" }
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
              <h1 className="text-xl font-bold text-purple-800">Heala - Patient Portal</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h2>
          <p className="text-gray-600">Here's your health overview for today</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col">
            <Calendar className="w-6 h-6 mb-1" />
            Book Appointment
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <User className="w-6 h-6 mb-1" />
            Find Doctor
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Heart className="w-6 h-6 mb-1" />
            Health Records
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Bell className="w-6 h-6 mb-1" />
            Emergency
          </Button>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="health">Health Data</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{appointment.doctor}</h4>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {appointment.date} at {appointment.time}
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
                      <p className="text-sm text-gray-600 mt-1">{appointment.type}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Heart Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-500">72 BPM</div>
                  <p className="text-sm text-gray-600">Normal range</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Blood Pressure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-500">120/80</div>
                  <p className="text-sm text-gray-600">Optimal</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weight</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">70 kg</div>
                  <p className="text-sm text-gray-600">Stable</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Communications with your healthcare team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-purple-500 bg-purple-50">
                    <h4 className="font-semibold">Dr. Sarah Johnson</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Your test results look good. Please continue your current medication.
                    </p>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-semibold">Health Assistant</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Reminder: Your appointment with Dr. Chen is tomorrow at 10:00 AM.
                    </p>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>Your health history and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                      <span className="text-sm">{activity.action}</span>
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

export default PatientDashboard;
