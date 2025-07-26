
import React from 'react';
import { EnhancedPatientPhysicianChat } from '@/components/enhanced-chat/EnhancedPatientPhysicianChat';

export const ChatTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Chat with Physician
      </h2>
      <EnhancedPatientPhysicianChat />
    </div>
  );
};
