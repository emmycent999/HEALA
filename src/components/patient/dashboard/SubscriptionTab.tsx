
import React from 'react';
import { SubscriptionUpgrade } from '@/components/patient/SubscriptionUpgrade';

export const SubscriptionTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Manage Subscription
      </h2>
      <SubscriptionUpgrade />
    </div>
  );
};
