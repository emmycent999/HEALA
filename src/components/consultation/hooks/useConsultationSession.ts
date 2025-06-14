
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConsultationSession, ConnectionStatus } from '../types';
import { UseConsultationSessionReturn } from './types';
import { fetchSessionData } from './sessionDataService';
import { startConsultationSession, endConsultationSession } from './sessionManagementService';
import { processConsultationPayment } from './paymentService';
import { formatDuration, calculateSessionDuration } from './sessionUtils';

export const useConsultationSession = (sessionId?: string | null): UseConsultationSessionReturn => {
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    } else {
      setLoading(false);
      setSession(null);
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === 'in_progress' && session.started_at) {
      interval = setInterval(() => {
        const duration = calculateSessionDuration(session.started_at!);
        setSessionDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const loadSessionData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const sessionData = await fetchSessionData(sessionId);
      
      if (!sessionData) {
        setSession(null);
        setConnectionStatus('disconnected');
        return;
      }

      setSession(sessionData);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching session:', error);
      setConnectionStatus('disconnected');
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
    if (!session) {
      toast({
        title: "Error",
        description: "No session available to start.",
        variant: "destructive"
      });
      return;
    }

    if (session.status === 'in_progress') {
      toast({
        title: "Session Already Active",
        description: "This session is already in progress.",
      });
      return;
    }

    try {
      const updatedSession = await startConsultationSession(session);
      setSession(updatedSession);

      toast({
        title: "Session Started",
        description: "Virtual consultation has begun.",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    if (!session) return;

    if (session.status !== 'in_progress') {
      toast({
        title: "Session Not Active",
        description: "This session is not currently in progress.",
        variant: "destructive"
      });
      return;
    }

    try {
      const updatedSession = await endConsultationSession(session);

      if (session.payment_status === 'pending') {
        try {
          const paymentSuccess = await processConsultationPayment(session);
          
          if (paymentSuccess) {
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
        } catch (paymentError) {
          console.error('Error processing payment:', paymentError);
          toast({
            title: "Payment Error",
            description: "Failed to process consultation payment.",
            variant: "destructive"
          });
        }
      }

      setSession(updatedSession);

      toast({
        title: "Session Ended",
        description: `Consultation completed. Duration: ${updatedSession.duration_minutes} minutes.`,
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
