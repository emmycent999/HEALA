
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Heart, Bell, Settings, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
            <Users className="w-6 h-6 mb-1" />
            Start Chat
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Heart className="w-6 h-6 mb-1" />
            Emergency
          </Button>
          <Button variant="outline" className="h-16 flex flex-col">
            <Clock className="w-6 h-6 mb-1" />
            Transport
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

        <Tabs defaultValue="chats" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chats">Active Chats</TabsTrigger>
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="bookings">Appointments</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
          </TabsList>

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
                        {request.type === 'Transport' && <Heart className="w-6 h-6 text-green-600" />}
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

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Management</CardTitle>
                <CardDescription>Book and manage patient appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending bookings</h3>
                  <p className="text-gray-600 mb-4">All appointment requests have been processed</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">New Booking</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transport" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transport Coordination</CardTitle>
                <CardDescription>Manage patient transport requests and scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">23</div>
                        <p className="text-sm text-gray-600">Active Requests</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">89</div>
                        <p className="text-sm text-gray-600">Completed Today</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">12</div>
                        <p className="text-sm text-gray-600">Available Drivers</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
