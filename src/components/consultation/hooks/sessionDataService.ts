
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const fetchSessionData = async (sessionId: string): Promise<ConsultationSession | null> => {
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
    return null;
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
  return completeSession;
};
