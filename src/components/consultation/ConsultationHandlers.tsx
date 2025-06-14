
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

  useEffect(() => {
    if (!userId || !sessionId) {
      console.log('Missing userId or sessionId, skipping handlers setup');
      return;
    }

    console.log('Setting up consultation handlers for:', { sessionId, userId, role: isPatient ? 'patient' : 'physician' });

    // Set up database change listener
    const dbChannel = supabase
      .channel(`consultation_db_${sessionId}_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('📡 Database change detected:', payload);
          const newSession = payload.new as any;
          const oldSession = payload.old as any;
          
          // Check if status changed from scheduled to in_progress
          if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
            console.log('🚀 Consultation started via database update!');
            
            if (isPatient) {
              toast({
                title: "🚨 Doctor Started Consultation!",
                description: "Automatically joining the video call...",
                duration: 8000,
              });
              
              // Trigger the consultation started handler
              setTimeout(() => {
                onConsultationStarted();
              }, 500);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Database subscription status:', status);
      });

    // Set up broadcast listener as backup
    const broadcastChannel = supabase
      .channel(`consultation_broadcast_${sessionId}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        console.log('📢 Received consultation-started broadcast:', payload);
        const data = payload.payload;
        
        if (data?.startedBy !== userId && isPatient) {
          console.log('🎯 Patient receiving consultation start notification');
          
          toast({
            title: "🚨 Doctor Started Consultation!",
            description: "Connecting you to the video call now...",
            duration: 8000,
          });
          
          // Trigger the consultation started handler
          setTimeout(() => {
            onConsultationStarted();
          }, 500);
        }
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        console.log('📢 Received patient-joined broadcast:', payload);
        const data = payload.payload;
        
        if (data?.patientId !== userId && isPhysician) {
          console.log('👨‍⚕️ Physician notified of patient joining');
          onPatientJoined();
        }
      })
      .subscribe((status) => {
        console.log('Broadcast subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up consultation handlers');
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [sessionId, userId, isPatient, isPhysician, toast, onConsultationStarted, onPatientJoined]);
};

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    console.log('📤 Sending consultation started notification for session:', sessionId);
    
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

    console.log('✅ Consultation start notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    console.log('📤 Sending patient joined notification for session:', sessionId);
    
    const channel = supabase.channel(`consultation_broadcast_${sessionId}`);
    
    await channel.send({
      type: 'broadcast',
      event: 'patient-joined',
      payload: { 
        patientId, 
        sessionId, 
        timestamp: new Date().toISOString() 
      }
    });

    console.log('✅ Patient joined notification sent successfully');
  } catch (error) {
    console.error('❌ Error sending patient joined notification:', error);
    throw error;
  }
};
