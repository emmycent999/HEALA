
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  physician: {
    first_name: string;
    last_name: string;
    specialization: string;
    phone?: string;
  };
  hospital?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

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
      setAppointments(data || []);
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
            <div key={appointment.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Dr. {appointment.physician.first_name} {appointment.physician.last_name}
                  </h4>
                  <p className="text-sm text-gray-600">{appointment.physician.specialization}</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  Scheduled
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(appointment.appointment_date), 'PPP')}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {appointment.appointment_time}
                  </div>
                  {appointment.physician.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {appointment.physician.phone}
                    </div>
                  )}
                </div>

                {appointment.hospital && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {appointment.hospital.name}
                    </div>
                    {appointment.hospital.address && (
                      <p className="text-sm text-gray-600 ml-6">
                        {appointment.hospital.address}
                      </p>
                    )}
                    {appointment.hospital.phone && (
                      <div className="flex items-center gap-2 text-sm ml-6">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {appointment.hospital.phone}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                  <strong>Notes:</strong> {appointment.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
