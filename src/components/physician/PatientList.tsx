
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PatientListProps {
  patients: Patient[];
  onStartConversation: (patientId: string, patientName: string) => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onStartConversation }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start New Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <p className="text-sm text-gray-600">No patients available</p>
        ) : (
          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                onClick={() => onStartConversation(patient.id, `${patient.first_name} ${patient.last_name}`)}
              >
                <div className="font-medium text-sm">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-xs text-gray-600">{patient.email}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
