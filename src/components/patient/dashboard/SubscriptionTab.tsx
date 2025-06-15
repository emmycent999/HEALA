
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Crown, Check } from 'lucide-react';

export const SubscriptionTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Subscription</h2>
        <p className="text-gray-600">Choose the plan that works best for you</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
              <Star className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Free</CardTitle>
            <div className="text-4xl font-bold text-gray-900">
              ₦0<span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">2 free in-person bookings</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Limited chat bot use</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-6 bg-black text-white hover:bg-gray-800"
            >
              Activate Free Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-2 border-blue-500">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              <Crown className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Premium</CardTitle>
            <div className="text-4xl font-bold text-gray-900">
              ₦5,000<span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Priority booking</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Unlimited in-person booking</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Unlimited chat bot use</span>
              </div>
            </div>
            <Button className="w-full mt-6 bg-black text-white hover:bg-gray-800">
              Subscribe to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
