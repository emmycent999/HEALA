
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useResourceData } from './resource-management/useResourceData';
import { CriticalAlerts } from './resource-management/CriticalAlerts';
import { ResourceStats } from './resource-management/ResourceStats';
import { ResourceCategoryTabs } from './resource-management/ResourceCategoryTabs';

export const HospitalResourceManagement: React.FC = () => {
  const { resources } = useResourceData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Critical Alerts */}
      <CriticalAlerts />

      {/* Overview Stats */}
      <ResourceStats resources={resources} />

      {/* Resource Categories */}
      <ResourceCategoryTabs resources={resources} />
    </div>
  );
};
