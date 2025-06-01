
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
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      
      // Fetch related data separately
      const appointmentsWithDetails = await Promise.all(
        (data || []).map(async (appointment) => {
          // Fetch physician details
          let physician = null;
          if (appointment.physician_id) {
            const { data: physicianData } = await supabase
              .from('profiles')
              .select('first_name, last_name, specialization, phone')
              .eq('id', appointment.physician_id)
              .single();
            
            if (physicianData) {
              physician = {
                first_name: physicianData.first_name || '',
                last_name: physicianData.last_name || '',
                specialization: physicianData.specialization || '',
                phone: physicianData.phone
              };
            }
          }

          // Fetch hospital details
          let hospital = null;
          if (appointment.hospital_id) {
            const { data: hospitalData } = await supabase
              .from('hospitals')
              .select('name, address, phone')
              .eq('id', appointment.hospital_id)
              .single();
            
            if (hospitalData) {
              hospital = {
                name: hospitalData.name || '',
                address: hospitalData.address,
                phone: hospitalData.phone
              };
            }
          }

          return {
            id: appointment.id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            notes: appointment.notes,
            physician: physician || {
              first_name: 'Unknown',
              last_name: 'Physician',
              specialization: 'General Practice'
            },
            hospital
          };
        })
      );
      
      setAppointments(appointmentsWithDetails);
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
