
import { useState } from 'react';
import { Resource } from './ResourceCard';

export const useResourceData = () => {
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

  return { resources };
};
