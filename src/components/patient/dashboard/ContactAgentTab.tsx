
import React from 'react';
import { ContactAgent } from '@/components/patient/ContactAgent';

export const ContactAgentTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Contact Agent
      </h2>
      <ContactAgent />
    </div>
  );
};
