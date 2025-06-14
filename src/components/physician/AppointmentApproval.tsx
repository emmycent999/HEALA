import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Check, X, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const AppointmentApproval: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingAppointments();
    }
  }, [user]);

  const fetchPendingAppointments = async () => {
    if (!user) return;

    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('physician_id', user.id)
        .eq('status', 'pending')
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Fetch patient details for each appointment
      const appointmentsWithPatients = await Promise.all(
        (appointments || []).map(async (appointment) => {
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', appointment.patient_id)
            .single();

          return {
            id: appointment.id,
            patient_id: appointment.patient_id,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            consultation_type: appointment.consultation_type,
            notes: appointment.notes,
            patient: patientData || { first_name: 'Unknown', last_name: 'Patient', email: '' }
          };
        })
      );

      setPendingAppointments(appointmentsWithPatients);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load pending appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConsultationSession = async (appointment: PendingAppointment) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          physician_id: user?.id,
          consultation_rate: profile?.current_consultation_rate || 5000,
          session_type: 'video',
          status: 'scheduled',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create a consultation room for the session
      const { error: roomError } = await supabase
        .from('consultation_rooms')
        .insert({
          session_id: sessionData.id,
          room_token: `room_${sessionData.id}`,
          room_status: 'waiting'
        });

      if (roomError) {
        console.error('Error creating consultation room:', roomError);
        // Don't throw here as the session was created successfully
      }

      return sessionData;
    } catch (error) {
      console.error('Error creating consultation session:', error);
      throw error;
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'accepted' | 'rejected', appointment: PendingAppointment) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: action })
        .eq('id', appointmentId);

      if (error) throw error;

      // If appointment is accepted and it's virtual, create a consultation session
      if (action === 'accepted' && appointment.consultation_type === 'virtual') {
        try {
          await createConsultationSession(appointment);
          
          toast({
            title: "Virtual Consultation Scheduled",
            description: `Virtual consultation session created for ${appointment.patient.first_name} ${appointment.patient.last_name}. You can now start the session from the Virtual Consultation tab.`,
          });
        } catch (sessionError) {
          console.error('Error creating consultation session:', sessionError);
          toast({
            title: "Warning",
            description: "Appointment accepted but failed to create consultation session. Please try again from the Virtual Consultation tab.",
            variant: "destructive"
          });
        }

        // Also create a chat conversation for virtual consultations
        const { error: conversationError } = await supabase
          .from('conversations')
          .insert({
            patient_id: appointment.patient_id,
            physician_id: user?.id,
            type: 'physician_consultation',
            title: `Virtual Consultation - ${appointment.patient.first_name} ${appointment.patient.last_name}`,
            status: 'active'
          });

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
        }
      } else if (action === 'accepted') {
        toast({
          title: "Appointment Accepted",
          description: `In-person appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been accepted.`,
        });
      } else {
        toast({
          title: "Appointment Rejected",
          description: `Appointment with ${appointment.patient.first_name} ${appointment.patient.last_name} has been rejected.`,
        });
      }

      fetchPendingAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    }
  };

  const getConsultationTypeIcon = (type: string) => {
    return type === 'virtual' ? <Video className="w-4 h-4" /> : <User className="w-4 h-4" />;
  };

  const getConsultationTypeBadge = (type: string) => {
    return type === 'virtual' ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800">Virtual</Badge>
    ) : (
      <Badge variant="secondary" className="bg-green-100 text-green-800">In-Person</Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading pending appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Appointments ({pendingAppointments.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending appointments to review
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getConsultationTypeIcon(appointment.consultation_type)}
                        <span className="font-medium">
                          {appointment.patient.first_name} {appointment.patient.last_name}
                        </span>
                        {getConsultationTypeBadge(appointment.consultation_type)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.appointment_time}
                      </div>
                      <div>{appointment.patient.email}</div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAppointmentAction(appointment.id, 'accepted', appointment)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAppointmentAction(appointment.id, 'rejected', appointment)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
