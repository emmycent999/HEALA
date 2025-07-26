
import React from 'react';
import { AmbulanceRequest } from '@/components/emergency/AmbulanceRequest';

export const AmbulanceTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Ambulance Services
      </h2>
      <AmbulanceRequest />
    </div>
  );
};
