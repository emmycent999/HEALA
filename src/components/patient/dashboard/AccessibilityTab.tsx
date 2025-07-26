
import React from 'react';
import { AccessibilitySettings } from '@/components/accessibility/AccessibilitySettings';

export const AccessibilityTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Accessibility Settings
      </h2>
      <AccessibilitySettings />
    </div>
  );
};
