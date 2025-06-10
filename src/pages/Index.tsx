

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Stethoscope, Calendar, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="gradient-card border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                alt="Heala" 
                className="h-8 w-auto"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"></span>
            </div>
            <div className="space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate("/auth/login")}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-white/50 backdrop-blur-sm"
              >
                Sign In
              </Button>
              <Button
                onClick={() => navigate("/auth/register")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-sm">
              <img 
                src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
                alt="Heala" 
                className="h-20 w-auto"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Your Health, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with healthcare professionals, book appointments, access emergency services, 
            and manage your health journey all in one comprehensive platform.
          </p>
          <div className="space-x-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth/register")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Start Your Health Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth/login")}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 bg-white/50 backdrop-blur-sm text-lg px-8 py-3"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for your health and wellness in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="gradient-card border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-700">Expert Physicians</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Connect with qualified healthcare professionals and specialists
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-700">Easy Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Book appointments online with your preferred healthcare providers
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-700">Emergency Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  24/7 emergency support and ambulance services when you need them most
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-700">Personal Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Dedicated agents to help you navigate your healthcare journey
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="gradient-card p-12 rounded-2xl border-white/20">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of users who trust Heala for their healthcare needs
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth/register")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              Get Started Today
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="gradient-card border-t border-white/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-8">
            <img 
              src="/lovable-uploads/dda110ed-e015-4894-970c-5086c3f1a4f8.png" 
              alt="Heala" 
              className="h-8 w-auto mr-3"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Heala</span>
          </div>
          <p className="text-gray-600">
            © 2025 Heala. All rights reserved. Your health, our priority.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

