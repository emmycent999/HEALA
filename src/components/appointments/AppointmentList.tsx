
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes?: string;
  physician: {
    first_name: string;
    last_name: string;
    specialization?: string;
  } | null;
  patient?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export const AppointmentList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      // First get the appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .or(`patient_id.eq.${user.id},physician_id.eq.${user.id}`)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      // Get unique physician and patient IDs
      const physicianIds = [...new Set(appointmentsData.map(a => a.physician_id).filter(Boolean))];
      const patientIds = [...new Set(appointmentsData.map(a => a.patient_id).filter(Boolean))];

      // Fetch physician profiles
      const { data: physicians, error: physicianError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .in('id', physicianIds);

      if (physicianError) {
        console.error('Error fetching physicians:', physicianError);
      }

      // Fetch patient profiles
      const { data: patients, error: patientError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      if (patientError) {
        console.error('Error fetching patients:', patientError);
      }

      // Combine the data
      const enrichedAppointments = appointmentsData.map(appointment => {
        const physician = physicians?.find(p => p.id === appointment.physician_id) || null;
        const patient = patients?.find(p => p.id === appointment.patient_id) || null;

        return {
          ...appointment,
          physician: physician ? {
            first_name: physician.first_name || '',
            last_name: physician.last_name || '',
            specialization: physician.specialization || undefined
          } : null,
          patient: patient ? {
            first_name: patient.first_name || '',
            last_name: patient.last_name || '',
            email: patient.email || ''
          } : null
        };
      });

      setAppointments(enrichedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canCancelAppointment = (appointmentDate: string, appointmentTime: string): boolean => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference >= 24;
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment cancelled successfully.",
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          My Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </span>
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{appointment.appointment_time}</span>
                      </div>
                      {appointment.physician && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Dr. {appointment.physician.first_name} {appointment.physician.last_name}
                          {appointment.physician.specialization && ` - ${appointment.physician.specialization}`}
                        </p>
                      )}
                      {appointment.patient && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {appointment.patient.first_name} {appointment.patient.last_name}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && 
                     canCancelAppointment(appointment.appointment_date, appointment.appointment_time) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelAppointment(appointment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                {appointment.status !== 'cancelled' && appointment.status !== 'completed' && 
                 !canCancelAppointment(appointment.appointment_date, appointment.appointment_time) && (
                  <p className="text-xs text-gray-500 mt-2">
                    * Appointments can only be cancelled 24 hours in advance
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
