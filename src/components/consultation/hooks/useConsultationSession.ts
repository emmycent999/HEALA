import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession, ConnectionStatus } from '../types';

export const useConsultationSession = (sessionId?: string | null) => {
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === 'in_progress' && session.started_at) {
      interval = setInterval(() => {
        const startTime = new Date(session.started_at!).getTime();
        const now = new Date().getTime();
        const duration = Math.floor((now - startTime) / 1000 / 60);
        setSessionDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const fetchSessionData = async () => {
    if (!sessionId) return;

    try {
      console.log('Fetching session data for:', sessionId);
      
      // Get the consultation session first
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        throw sessionError;
      }

      if (!sessionData) {
        console.log('No session found');
        setSession(null);
        return;
      }

      console.log('Session data found:', sessionData);

      // Get patient and physician profiles separately
      const [patientResult, physicianResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', sessionData.patient_id)
          .single(),
        supabase
          .from('profiles')
          .select('first_name, last_name, specialization')
          .eq('id', sessionData.physician_id)
          .single()
      ]);

      const completeSession: ConsultationSession = {
        ...sessionData,
        patient: patientResult.data,
        physician: physicianResult.data
      };

      console.log('Complete session with profiles:', completeSession);
      setSession(completeSession);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching session:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation session.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? {
        ...prev,
        status: 'in_progress',
        started_at: new Date().toISOString()
      } : null);

      toast({
        title: "Session Started",
        description: "Virtual consultation has begun.",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session.",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = session.started_at ? new Date(session.started_at) : new Date();
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          ended_at: endTime,
          duration_minutes: duration
        })
        .eq('id', session.id);

      if (error) throw error;

      if (session.payment_status === 'pending') {
        await processConsultationPayment();
      }

      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        ended_at: endTime,
        duration_minutes: duration
      } : null);

      toast({
        title: "Session Ended",
        description: `Consultation completed. Duration: ${duration} minutes.`,
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session.",
        variant: "destructive"
      });
    }
  };

  const processConsultationPayment = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.rpc('process_consultation_payment', {
        session_uuid: session.id,
        patient_uuid: session.patient_id,
        physician_uuid: session.physician_id,
        amount: session.consultation_rate
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Payment Processed",
          description: `₦${session.consultation_rate.toLocaleString()} has been deducted from your wallet.`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "Insufficient wallet balance. Please fund your wallet.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process consultation payment.",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return {
    session,
    loading,
    sessionDuration,
    connectionStatus,
    startSession,
    endSession,
    formatDuration
  };
};
