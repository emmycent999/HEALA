
import React from 'react';
import { OfflineManager } from '@/components/offline/OfflineManager';

export const OfflineTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Offline Features
      </h2>
      <OfflineManager />
    </div>
  );
};
