
import React from 'react';
import { PhysicianAssignment } from '@/components/patient/PhysicianAssignment';

export const PhysicianTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        My Physician
      </h2>
      <PhysicianAssignment />
    </div>
  );
};
