
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsultationHandlersProps {
  sessionId: string;
  userId: string;
  isPatient: boolean;
  isPhysician: boolean;
  onConsultationStarted: () => void;
  onPatientJoined: () => void;
}

export const useConsultationHandlers = ({
  sessionId,
  userId,
  isPatient,
  isPhysician,
  onConsultationStarted,
  onPatientJoined
}: ConsultationHandlersProps) => {
  const { toast } = useToast();

  // Listen for consultation start notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`consultation_${sessionId}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        console.log('Received consultation-started event:', payload);
        if (payload.payload.startedBy !== userId) {
          onConsultationStarted();
          if (isPatient) {
            toast({
              title: "🚨 Consultation Started!",
              description: "The doctor has started the consultation. Click 'Join Now' to connect.",
            });
          }
        }
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        console.log('Received patient-joined event:', payload);
        if (payload.payload.patientId !== userId && isPhysician) {
          onPatientJoined();
          toast({
            title: "Patient Joined",
            description: "The patient has joined the consultation.",
          });
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up channel subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, isPatient, isPhysician, toast, onConsultationStarted, onPatientJoined]);
};

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    // Create a dedicated channel for this notification
    const notificationChannel = supabase.channel(`consultation_notification_${sessionId}_${Date.now()}`);
    
    // Send notification to patient
    await notificationChannel.send({
      type: 'broadcast',
      event: 'consultation-started',
      payload: { 
        startedBy: userId, 
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Also send on the main channel
    const mainChannel = supabase.channel(`consultation_${sessionId}`);
    await mainChannel.send({
      type: 'broadcast',
      event: 'consultation-started',
      payload: { 
        startedBy: userId, 
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Consultation start notification sent');
  } catch (error) {
    console.error('Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    const channel = supabase.channel(`consultation_${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'patient-joined',
      payload: { patientId, sessionId }
    });
  } catch (error) {
    console.error('Error sending patient joined notification:', error);
    throw error;
  }
};
