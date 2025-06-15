
import React from 'react';
import { Button } from '@/components/ui/button';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { EnhancedAppointmentBooking } from '@/components/enhanced-appointments/EnhancedAppointmentBooking';
import { PrescriptionNotifications } from '@/components/prescriptions/PrescriptionNotifications';
import { useGlobalSessionMonitor } from '@/components/consultation/hooks/useGlobalSessionMonitor';

export const AppointmentsTab: React.FC = () => {
  const { activeSessions, isMonitoring, lastUpdate, manualSessionCheck } = useGlobalSessionMonitor({
    isEnabled: true,
    onSessionStarted: (sessionId: string) => {
      console.log('🎯 [PatientDashboard] Session started callback triggered:', sessionId);
    }
  });

  return (
    <div className="space-y-6">
      {/* Enhanced Debug Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-3">🔍 Session Monitor Debug Panel</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-blue-700">Monitoring Status:</span>
            <span className={`${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
              {isMonitoring ? '✅ Active' : '❌ Inactive'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-blue-700">Active Sessions:</span>
            <span className="text-blue-600">{activeSessions.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-blue-700">Last Update:</span>
            <span className="text-blue-600 text-xs">{lastUpdate.toLocaleTimeString()}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-blue-700">Actions:</span>
            <Button size="sm" onClick={manualSessionCheck} className="mt-1">
              🔄 Check Now
            </Button>
          </div>
        </div>
        {activeSessions.length > 0 && (
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
            <div className="font-medium text-blue-800 mb-1">Active Sessions:</div>
            {activeSessions.map(s => (
              <div key={s.id} className="text-blue-700">
                📍 {s.id.slice(0, 8)}... - Status: <span className="font-medium">{s.status}</span>
                {s.status === 'in_progress' && (
                  <span className="ml-2 text-green-600 font-bold animate-pulse">🔴 LIVE</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <PrescriptionNotifications />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Book New Appointment</h3>
          <EnhancedAppointmentBooking />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">My Appointments</h3>
          <AppointmentList />
        </div>
      </div>
    </div>
  );
};
