
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

  // Get patient and physician profiles separately with better error handling
  const [patientResult, physicianResult] = await Promise.allSettled([
    supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', sessionData.patient_id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('first_name, last_name, specialization')
      .eq('id', sessionData.physician_id)
      .maybeSingle()
  ]);

  // Handle patient data
  let patientData = { first_name: 'Unknown', last_name: 'Patient' };
  if (patientResult.status === 'fulfilled' && patientResult.value.data) {
    patientData = patientResult.value.data;
  } else if (patientResult.status === 'rejected') {
    console.error('Error fetching patient data:', patientResult.reason);
  }

  // Handle physician data
  let physicianData = { first_name: 'Unknown', last_name: 'Doctor', specialization: 'General' };
  if (physicianResult.status === 'fulfilled' && physicianResult.value.data) {
    physicianData = physicianResult.value.data;
  } else if (physicianResult.status === 'rejected') {
    console.error('Error fetching physician data:', physicianResult.reason);
  }

  // Build the complete session object
  const completeSession: ConsultationSession = {
    ...sessionData,
    patient: patientData,
    physician: physicianData
  };

  console.log('Complete session with profiles:', completeSession);
  return completeSession;
};
