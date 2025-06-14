
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
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const channelRef = useRef<any>(null);
  const processedEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEnabled || !user || profile?.role !== 'patient') {
      console.log('🔕 [GlobalSessionMonitor] Disabled or not a patient');
      return;
    }

    console.log('🌍 [GlobalSessionMonitor] Setting up simplified global monitoring for patient:', user.id);

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Simplified global monitoring - just database changes
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
      console.log('🧹 [GlobalSessionMonitor] Cleaning up global monitor');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isEnabled, user, profile]);

  const handleSessionUpdate = (payload: any) => {
    const newSession = payload.new;
    const oldSession = payload.old;
    
    // Create unique event ID
    const eventId = `global_${newSession.id}_${newSession.status}_${Date.now()}`;
    
    if (processedEventsRef.current.has(eventId)) {
      console.log('🔄 [GlobalSessionMonitor] Event already processed:', eventId);
      return;
    }
    
    processedEventsRef.current.add(eventId);
    
    // Check if session status changed from scheduled to in_progress
    if (oldSession?.status === 'scheduled' && newSession?.status === 'in_progress') {
      console.log('🚨 [GlobalSessionMonitor] CONSULTATION STARTED! Session:', newSession.id);
      
      // Update active sessions
      setActiveSessions(prev => [...prev, newSession.id]);
      
      // Show browser notification
      showBrowserNotification(newSession);
      
      // Show toast notification
      toast({
        title: "🚨 Doctor Started Consultation!",
        description: "Redirecting to video call now...",
        duration: 5000,
      });
      
      // Immediate redirect to the consultation session
      console.log('🔀 [GlobalSessionMonitor] Immediate redirect to session:', newSession.id);
      navigate(`/patient?tab=virtual-consultation&session=${newSession.id}`);
      
      // Trigger callback if provided
      if (onSessionStarted) {
        onSessionStarted(newSession.id);
      }
    }
  };

  const showBrowserNotification = (session: any) => {
    // Request permission if not already granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(session);
        }
      });
    } else if (Notification.permission === 'granted') {
      createNotification(session);
    }
  };

  const createNotification = (session: any) => {
    try {
      const notification = new Notification('🚨 Doctor Started Consultation!', {
        body: 'Your doctor has started the video consultation. Click to join.',
        icon: '/favicon.ico',
        tag: `consultation-${session.id}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        window.focus();
        navigate(`/patient?tab=virtual-consultation&session=${session.id}`);
        notification.close();
      };

      // Auto-close after 8 seconds
      setTimeout(() => {
        notification.close();
      }, 8000);
    } catch (error) {
      console.error('❌ [GlobalSessionMonitor] Error creating notification:', error);
    }
  };

  return {
    activeSessions,
    isMonitoring: isEnabled && !!channelRef.current
  };
};
