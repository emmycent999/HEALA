
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface GlobalSessionMonitorProps {
  isEnabled: boolean;
  onSessionStarted?: (sessionId: string) => void;
}

export const useGlobalSessionMonitor = ({ 
  isEnabled, 
  onSessionStarted 
}: GlobalSessionMonitorProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isEnabled || !user || profile?.role !== 'patient') {
      console.log('🔕 [GlobalSessionMonitor] Disabled or not a patient');
      return;
    }

    console.log('🌍 [GlobalSessionMonitor] Setting up monitoring for patient:', user.id);

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Simple database monitoring
    channelRef.current = supabase
      .channel(`patient_sessions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🌍 [GlobalSessionMonitor] Session update detected:', payload);
          handleSessionUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('🌍 [GlobalSessionMonitor] Subscription status:', status);
      });

    return () => {
      console.log('🧹 [GlobalSessionMonitor] Cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isEnabled, user, profile]);

  const handleSessionUpdate = (payload: any) => {
    const newSession = payload.new;
    const oldSession = payload.old;
    
    // Check if session status changed to in_progress
    if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
      console.log('🚨 [GlobalSessionMonitor] CONSULTATION STARTED! Session:', newSession.id);
      
      // Show notification
      toast({
        title: "🚨 Doctor Started Consultation!",
        description: "Redirecting to video call now...",
        duration: 3000,
      });
      
      // Immediate redirect
      console.log('🔀 [GlobalSessionMonitor] Redirecting to session:', newSession.id);
      navigate(`/patient?tab=virtual-consultation&session=${newSession.id}`);
      
      // Trigger callback
      if (onSessionStarted) {
        onSessionStarted(newSession.id);
      }
    }
  };

  return {
    isMonitoring: isEnabled && !!channelRef.current
  };
};
