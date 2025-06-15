
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown } from 'lucide-react';

export const SubscriptionTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Manage Subscription
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Star className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Free</CardTitle>
            <div className="text-4xl font-bold">
              ₦0
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>2 free in-person bookings</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Limited chat bot use</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              variant="default"
            >
              Activate Free Plan
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-blue-500 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
          </div>
          
          <CardHeader className="text-center pb-4 pt-6">
            <div className="flex justify-center mb-2">
              <Crown className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Premium</CardTitle>
            <div className="text-4xl font-bold">
              ₦5,000
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Priority booking</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Unlimited in-person booking</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Unlimited chat bot use</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              variant="default"
            >
              Subscribe to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
