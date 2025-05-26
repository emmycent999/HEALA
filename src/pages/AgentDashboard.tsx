
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Heart, Bell, Settings, User, Users, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AssistedPatients } from "@/components/agent/AssistedPatients";
import { AppointmentBookingAgent } from "@/components/agent/AppointmentBooking";
import { TransportBooking } from "@/components/agent/TransportBooking";

const AgentDashboard = () => {
  const navigate = useNavigate();
  const [notifications] = useState(4);

  const agentStats = [
    { label: "Assisted Patients", value: "156", change: "+8%" },
    { label: "Appointments Booked", value: "89", change: "+12%" },
    { label: "Active Chats", value: "12", change: "+3%" },
    { label: "Transport Requests", value: "23", change: "+15%" }
  ];

  const activeChats = [
    {
      id: 1,
      patient: "John Smith",
      issue: "Appointment booking assistance",
      time: "2 min ago",
      priority: "normal"
    },
    {
      id: 2,
      patient: "Maria Garcia",
      issue: "Emergency transport request",
      time: "5 min ago",
      priority: "urgent"
    },
    {
      id: 3,
      patient: "David Wilson",
      issue: "Insurance verification",
      time: "10 min ago",
      priority: "normal"
    }
  ];

  const pendingRequests = [
    { id: 1, type: "Appointment", patient: "Sarah Brown", details: "Cardiology consultation", time: "15 min ago" },
    { id: 2, type: "Transport", patient: "Michael Chen", details: "Pickup from 123 Main St", time: "20 min ago" },
    { id: 3, type: "Insurance", patient: "Lisa Johnson", details: "Coverage verification", time: "25 min ago" }
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
              <h1 className="text-xl font-bold text-purple-800">Heala - Agent Portal</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Agent Sarah!</h2>
          <p className="text-gray-600">You have 12 active chats and 23 pending requests</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Button className="h-16 bg-purple-600 hover:bg-purple-700 flex flex-col">
            <Calendar className="w-6 h-6 mb-1" />
            New Booking
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Car className="w-6 h-6 mb-1" />
            Book Transport
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Users className="w-6 h-6 mb-1" />
            Manage Patients
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Clock className="w-6 h-6 mb-1" />
            Emergency
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {agentStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <span className={`text-sm ${stat.change.includes('+') ? 'text-green-600' : 'text-gray-600'}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="patients">Assisted Patients</TabsTrigger>
            <TabsTrigger value="appointments">Book Appointments</TabsTrigger>
            <TabsTrigger value="transport">Book Transport</TabsTrigger>
            <TabsTrigger value="chats">Active Chats</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-4">
            <AssistedPatients />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <AppointmentBookingAgent />
          </TabsContent>

          <TabsContent value="transport" className="space-y-4">
            <TransportBooking />
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Patient Chats</CardTitle>
                <CardDescription>Ongoing conversations requiring assistance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeChats.map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{chat.patient}</h4>
                        <p className="text-sm text-gray-600">{chat.issue}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{chat.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={chat.priority === 'urgent' ? 'destructive' : 'default'}
                        className={chat.priority === 'normal' ? 'bg-blue-100 text-blue-800' : ''}
                      >
                        {chat.priority}
                      </Badge>
                      <div className="mt-2">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Join Chat</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Patient requests requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        request.type === 'Appointment' ? 'bg-blue-100' :
                        request.type === 'Transport' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {request.type === 'Appointment' && <Calendar className="w-6 h-6 text-blue-600" />}
                        {request.type === 'Transport' && <Car className="w-6 h-6 text-green-600" />}
                        {request.type === 'Insurance' && <User className="w-6 h-6 text-purple-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{request.patient}</h4>
                        <p className="text-sm text-gray-600">{request.details}</p>
                        <span className="text-xs text-gray-500">{request.time}</span>
                      </div>
                    </div>
                    <div className="text-right space-x-2">
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Process</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
