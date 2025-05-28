
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Appointment } from './types';
import { AppointmentCard } from './AppointmentCard';

export const AppointmentList = () => {
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
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          notes,
          physician:profiles!appointments_physician_id_fkey (
            first_name,
            last_name,
            specialization,
            phone
          ),
          hospital:hospitals (
            name,
            address,
            phone
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      const formattedAppointments: Appointment[] = (data || []).map(item => ({
        id: item.id,
        appointment_date: item.appointment_date,
        appointment_time: item.appointment_time,
        notes: item.notes,
        physician: item.physician as Appointment['physician'],
        hospital: item.hospital as Appointment['hospital']
      }));
      
      setAppointments(formattedAppointments);
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No appointments scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
