
import React from 'react';
import { TransportBooking } from '@/components/patient/TransportBooking';

export const TransportTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Transport Services
      </h2>
      <TransportBooking />
    </div>
  );
};
