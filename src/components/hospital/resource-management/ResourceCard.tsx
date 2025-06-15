
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bed, 
  Stethoscope, 
  Truck, 
  Activity,
  Heart
} from 'lucide-react';

export interface Resource {
  id: string;
  name: string;
  category: string;
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  status: 'available' | 'limited' | 'critical';
}

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'beds':
        return <Bed className="w-5 h-5" />;
      case 'equipment':
        return <Stethoscope className="w-5 h-5" />;
      case 'vehicles':
        return <Truck className="w-5 h-5" />;
      case 'rooms':
        return <Activity className="w-5 h-5" />;
      default:
        return <Heart className="w-5 h-5" />;
    }
  };

  const getUtilizationPercentage = (resource: Resource) => {
    return Math.round((resource.inUse / resource.total) * 100);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getCategoryIcon(resource.category)}
            <div>
              <h4 className="font-medium">{resource.name}</h4>
              <p className="text-sm text-gray-600 capitalize">{resource.category}</p>
            </div>
          </div>
          <Badge className={getStatusColor(resource.status)}>
            {resource.status}
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-bold">{resource.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-lg font-bold text-green-600">{resource.available}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">In Use</p>
            <p className="text-lg font-bold text-blue-600">{resource.inUse}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Maintenance</p>
            <p className="text-lg font-bold text-orange-600">{resource.maintenance}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Utilization</span>
            <span>{getUtilizationPercentage(resource)}%</span>
          </div>
          <Progress value={getUtilizationPercentage(resource)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
