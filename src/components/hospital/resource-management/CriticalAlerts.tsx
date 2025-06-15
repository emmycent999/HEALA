
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const CriticalAlerts: React.FC = () => {
  return (
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
  );
};
