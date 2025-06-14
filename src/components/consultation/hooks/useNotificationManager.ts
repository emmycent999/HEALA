
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationManagerProps {
  sessionId: string;
  userId: string;
  isPatient: boolean;
  isPhysician: boolean;
  onConsultationStarted: () => void;
  onPatientJoined: () => void;
}

export const useNotificationManager = ({
  sessionId,
  userId,
  isPatient,
  isPhysician,
  onConsultationStarted,
  onPatientJoined
}: NotificationManagerProps) => {
  const { toast } = useToast();
  const channelsRef = useRef<any[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !sessionId) {
      console.log('⚠️ [NotificationManager] Missing userId or sessionId, skipping setup');
      return;
    }

    console.log('🔔 [NotificationManager] Setting up notifications for:', { 
      sessionId, 
      userId, 
      role: isPatient ? 'patient' : 'physician' 
    });

    // Clean up any existing channels first
    cleanup();

    // Set up database change listener - PRIMARY notification method
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
          console.log('📡 [NotificationManager] Database change detected:', payload);
          handleDatabaseChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 [NotificationManager] Database subscription status:', status);
      });

    // Set up broadcast listener - BACKUP notification method
    const broadcastChannel = supabase
      .channel(`consultation_broadcast_${sessionId}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        console.log('📢 [NotificationManager] Consultation-started broadcast received:', payload);
        handleConsultationStartedBroadcast(payload);
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        console.log('📢 [NotificationManager] Patient-joined broadcast received:', payload);
        handlePatientJoinedBroadcast(payload);
      })
      .subscribe((status) => {
        console.log('📢 [NotificationManager] Broadcast subscription status:', status);
      });

    // Store channels for cleanup
    channelsRef.current = [dbChannel, broadcastChannel];

    return cleanup;
  }, [sessionId, userId, isPatient, isPhysician]);

  const handleDatabaseChange = (payload: any) => {
    const newSession = payload.new as any;
    const oldSession = payload.old as any;
    
    // Create unique event ID to prevent duplicates
    const eventId = `db_change_${newSession.id}_${newSession.status}_${newSession.updated_at}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    // Check if status changed from scheduled to in_progress
    if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
      console.log('🚀 [NotificationManager] Consultation started via database update!');
      
      if (isPatient) {
        toast({
          title: "🚨 Doctor Started Consultation!",
          description: "Automatically joining the video call...",
          duration: 8000,
        });
        
        // Trigger the consultation started handler with delay
        setTimeout(() => {
          onConsultationStarted();
        }, 500);
      }
    }
  };

  const handleConsultationStartedBroadcast = (payload: any) => {
    const data = payload.payload;
    const eventId = `broadcast_started_${data?.sessionId}_${data?.timestamp}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Broadcast event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    if (data?.startedBy !== userId && isPatient) {
      console.log('🎯 [NotificationManager] Patient receiving consultation start notification via broadcast');
      
      toast({
        title: "🚨 Doctor Started Consultation!",
        description: "Connecting you to the video call now...",
        duration: 8000,
      });
      
      setTimeout(() => {
        onConsultationStarted();
      }, 500);
    }
  };

  const handlePatientJoinedBroadcast = (payload: any) => {
    const data = payload.payload;
    const eventId = `broadcast_joined_${data?.patientId}_${data?.timestamp}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [NotificationManager] Patient joined event already processed, skipping:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    if (data?.patientId !== userId && isPhysician) {
      console.log('👨‍⚕️ [NotificationManager] Physician notified of patient joining via broadcast');
      onPatientJoined();
    }
  };

  const cleanup = () => {
    console.log('🧹 [NotificationManager] Cleaning up channels');
    channelsRef.current.forEach(channel => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    });
    channelsRef.current = [];
    processedEventsRef.current.clear();
  };

  return { cleanup };
};

export const sendConsultationStarted = async (sessionId: string, userId: string) => {
  try {
    console.log('📤 [NotificationManager] Sending consultation started notification for session:', sessionId);
    
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

    console.log('✅ [NotificationManager] Consultation start notification sent successfully');
  } catch (error) {
    console.error('❌ [NotificationManager] Error sending consultation started notification:', error);
    throw error;
  }
};

export const sendPatientJoined = async (sessionId: string, patientId: string) => {
  try {
    console.log('📤 [NotificationManager] Sending patient joined notification for session:', sessionId);
    
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

    console.log('✅ [NotificationManager] Patient joined notification sent successfully');
  } catch (error) {
    console.error('❌ [NotificationManager] Error sending patient joined notification:', error);
    throw error;
  }
};
