import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bed, 
  Stethoscope, 
  Truck, 
  Users, 
  AlertTriangle, 
  Plus,
  Activity,
  Clock,
  Heart
} from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  category: string;
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  status: 'available' | 'limited' | 'critical';
}

export const HospitalResourceManagement: React.FC = () => {
  const [resources] = useState<Resource[]>([
    {
      id: '1',
      name: 'ICU Beds',
      category: 'beds',
      total: 50,
      available: 12,
      inUse: 35,
      maintenance: 3,
      status: 'limited'
    },
    {
      id: '2',
      name: 'General Beds',
      category: 'beds',
      total: 200,
      available: 45,
      inUse: 150,
      maintenance: 5,
      status: 'available'
    },
    {
      id: '3',
      name: 'Ventilators',
      category: 'equipment',
      total: 25,
      available: 3,
      inUse: 20,
      maintenance: 2,
      status: 'critical'
    },
    {
      id: '4',
      name: 'X-Ray Machines',
      category: 'equipment',
      total: 8,
      available: 2,
      inUse: 5,
      maintenance: 1,
      status: 'available'
    },
    {
      id: '5',
      name: 'Ambulances',
      category: 'vehicles',
      total: 12,
      available: 4,
      inUse: 7,
      maintenance: 1,
      status: 'available'
    },
    {
      id: '6',
      name: 'Operating Rooms',
      category: 'rooms',
      total: 15,
      available: 3,
      inUse: 10,
      maintenance: 2,
      status: 'available'
    }
  ]);

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

  const getAvailabilityPercentage = (resource: Resource) => {
    return Math.round((resource.available / resource.total) * 100);
  };

  const resourcesByCategory = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Critical Resource Alert</h4>
              <p className="text-sm text-red-600">
                Ventilators are running low (3 available). Consider emergency procurement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Resources</p>
                <p className="text-2xl font-bold">{resources.reduce((acc, r) => acc + r.total, 0)}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {resources.reduce((acc, r) => acc + r.available, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Use</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resources.reduce((acc, r) => acc + r.inUse, 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">
                  {resources.reduce((acc, r) => acc + r.maintenance, 0)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Categories */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="beds">Beds</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4">
            {resources.map((resource) => (
              <Card key={resource.id}>
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
            ))}
          </div>
        </TabsContent>

        {Object.entries(resourcesByCategory).map(([category, categoryResources]) => (
          <TabsContent key={category} value={category}>
            <div className="grid gap-4">
              {categoryResources.map((resource) => (
                <Card key={resource.id}>
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
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
