
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Heart, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const userTypes = [
    {
      title: "Patient",
      description: "Book appointments, view medical records, and chat with healthcare providers",
      icon: Heart,
      color: "bg-purple-100 text-purple-700",
      route: "/patient-dashboard"
    },
    {
      title: "Physician",
      description: "Manage appointments, view patient records, and provide consultations",
      icon: Users,
      color: "bg-blue-100 text-blue-700",
      route: "/physician-dashboard"
    },
    {
      title: "Hospital Admin",
      description: "Oversee hospital operations, manage staff, and view analytics",
      icon: Settings,
      color: "bg-green-100 text-green-700",
      route: "/hospital-dashboard"
    },
    {
      title: "Agent",
      description: "Assist patients with bookings and coordinate care services",
      icon: Calendar,
      color: "bg-orange-100 text-orange-700",
      route: "/agent-dashboard"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-purple-800">Heala</h1>
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              Healthcare Platform
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Heala
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your comprehensive healthcare management platform. Choose your role to access your personalized dashboard.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {userTypes.map((userType) => (
            <Card 
              key={userType.title} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(userType.route)}
            >
              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-full ${userType.color} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <userType.icon className="w-8 h-8" />
                </div>
                <CardTitle className="text-lg">{userType.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center mb-4">
                  {userType.description}
                </CardDescription>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(userType.route);
                  }}
                >
                  Access Dashboard
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-gray-600">AI-powered appointment booking and management system</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Care Coordination</h3>
            <p className="text-gray-600">Seamless communication between patients and providers</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Multi-Role Support</h3>
            <p className="text-gray-600">Tailored experiences for patients, doctors, and administrators</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
