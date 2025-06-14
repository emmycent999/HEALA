
import { useEffect, useRef, useState } from 'react';
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
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!isEnabled || !user || profile?.role !== 'patient') {
      console.log('🔕 [GlobalSessionMonitor] Disabled - isEnabled:', isEnabled, 'user:', !!user, 'role:', profile?.role);
      return;
    }

    console.log('🌍 [GlobalSessionMonitor] Setting up monitoring for patient:', user.id);

    // First, fetch existing sessions to see current state
    fetchCurrentSessions();
    
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Set up real-time monitoring with more specific filter
    channelRef.current = supabase
      .channel(`global_patient_sessions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'consultation_sessions',
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🌍 [GlobalSessionMonitor] Any session change detected:', payload);
          handleSessionUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('🌍 [GlobalSessionMonitor] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [GlobalSessionMonitor] Successfully subscribed to real-time updates');
        }
      });

    return () => {
      console.log('🧹 [GlobalSessionMonitor] Cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isEnabled, user, profile]);

  const fetchCurrentSessions = async () => {
    if (!user) return;
    
    try {
      console.log('📋 [GlobalSessionMonitor] Fetching current sessions for patient:', user.id);
      
      const { data: sessions, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [GlobalSessionMonitor] Error fetching sessions:', error);
        return;
      }

      console.log('📋 [GlobalSessionMonitor] Current sessions:', sessions);
      setActiveSessions(sessions || []);
      
      // Check if any session is already in progress
      const inProgressSession = sessions?.find(s => s.status === 'in_progress');
      if (inProgressSession) {
        console.log('🎯 [GlobalSessionMonitor] Found session already in progress:', inProgressSession.id);
        toast({
          title: "🚨 Active Consultation Found!",
          description: "Redirecting to ongoing consultation...",
          duration: 3000,
        });
        navigate(`/patient?tab=virtual-consultation&session=${inProgressSession.id}`);
      }
    } catch (error) {
      console.error('❌ [GlobalSessionMonitor] Error in fetchCurrentSessions:', error);
    }
  };

  const handleSessionUpdate = (payload: any) => {
    const newSession = payload.new;
    const oldSession = payload.old;
    
    console.log('🔄 [GlobalSessionMonitor] Processing session update:', {
      event: payload.eventType,
      sessionId: newSession?.id,
      oldStatus: oldSession?.status,
      newStatus: newSession?.status
    });
    
    // Update active sessions list
    if (payload.eventType === 'UPDATE' && newSession) {
      setActiveSessions(prev => {
        const updated = prev.map(s => s.id === newSession.id ? newSession : s);
        return updated;
      });
    }
    
    // Check if session status changed to in_progress
    if (payload.eventType === 'UPDATE' && 
        oldSession?.status === 'scheduled' && 
        newSession?.status === 'in_progress') {
      
      console.log('🚨 [GlobalSessionMonitor] CONSULTATION STARTED! Session:', newSession.id);
      
      // Show immediate notification
      toast({
        title: "🚨 Doctor Started Consultation!",
        description: "Redirecting to video call now...",
        duration: 5000,
      });
      
      // Immediate redirect - no delays
      console.log('🔀 [GlobalSessionMonitor] Immediate redirect to session:', newSession.id);
      navigate(`/patient?tab=virtual-consultation&session=${newSession.id}`);
      
      // Trigger callback
      if (onSessionStarted) {
        onSessionStarted(newSession.id);
      }
    }
  };

  return {
    isMonitoring: isEnabled && !!channelRef.current,
    activeSessions
  };
};
