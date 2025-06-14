
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

  // Listen for database changes and real-time notifications
  useEffect(() => {
    if (!userId || !sessionId) return;

    console.log('Setting up consultation handlers for session:', sessionId, 'user:', userId, 'role:', isPatient ? 'patient' : 'physician');

    // Primary: Listen for database changes on the consultation_sessions table
    const dbChannel = supabase
      .channel(`consultation_db_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Database change detected:', payload);
          const newSession = payload.new as any;
          const oldSession = payload.old as any;
          
          // Check if status changed from scheduled to in_progress
          if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
            console.log('Consultation started via database update - triggering handler');
            onConsultationStarted();
            
            if (isPatient) {
              toast({
                title: "🚨 Consultation Started!",
                description: "The doctor has started the consultation. Click 'Join Video Call Now' to connect.",
                duration: 10000,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Database subscription status:', status);
      });

    // Secondary: Listen for broadcast messages as backup
    const broadcastChannel = supabase
      .channel(`consultation_broadcast_${sessionId}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        console.log('Received consultation-started broadcast:', payload);
        if (payload.payload?.startedBy !== userId) {
          console.log('Broadcast consultation started - triggering handler');
          onConsultationStarted();
          if (isPatient) {
            toast({
              title: "🚨 Consultation Started!",
              description: "The doctor has started the consultation. Click 'Join Video Call Now' to connect.",
              duration: 10000,
            });
          }
        }
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        console.log('Received patient-joined broadcast:', payload);
        if (payload.payload?.patientId !== userId && isPhysician) {
          onPatientJoined();
          toast({
            title: "Patient Joined",
            description: "The patient has joined the consultation.",
          });
        }
      })
      .subscribe((status) => {
        console.log('Broadcast subscription status:', status);
      });

    return () => {
      console.log('Cleaning up consultation handlers');
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [sessionId, userId, isPatient, isPhysician, toast, onConsultationStarted, onPatientJoined]);
};

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    console.log('Sending consultation started notification for session:', sessionId);
    
    // Send broadcast notification
    const channel = supabase.channel(`consultation_broadcast_${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'consultation-started',
      payload: { 
        startedBy: userId, 
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Consultation start notification sent successfully');
  } catch (error) {
    console.error('Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    console.log('Sending patient joined notification for session:', sessionId);
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'patient-joined',
      payload: { patientId, sessionId, timestamp: new Date().toISOString() }
    });

    console.log('Patient joined notification sent successfully');
  } catch (error) {
    console.error('Error sending patient joined notification:', error);
    throw error;
  }
};
