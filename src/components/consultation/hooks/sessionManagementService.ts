
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const startConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
  console.log('Starting session:', session.id);
  
  const { error } = await supabase
    .from('consultation_sessions')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('Error starting session:', error);
    throw error;
  }

  const updatedSession = {
    ...session,
    status: 'in_progress' as const,
    started_at: new Date().toISOString()
  };

  console.log('Session started successfully');
  return updatedSession;
};

export const endConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
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

  return {
    ...session,
    status: 'completed',
    ended_at: endTime,
    duration_minutes: duration
  };
};
