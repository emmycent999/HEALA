
import React from 'react';
import { PatientSettings } from '@/components/patient/PatientSettings';

export const SettingsTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h2>
      <PatientSettings />
    </div>
  );
};
