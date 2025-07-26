
import React from 'react';
import { EmergencyContacts } from '@/components/emergency/EmergencyContacts';

export const EmergencyContactsTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Emergency Contacts
      </h2>
      <EmergencyContacts />
    </div>
  );
};
