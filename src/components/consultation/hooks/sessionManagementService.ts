
import { supabase } from '@/integrations/supabase/client';
import { ConsultationSession } from '../types';

export const startConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
  console.log('🚀 [SessionManagement] Starting session using database function:', session.id);
  
  try {
    // Use the new database function for secure session starting
    const { data, error } = await supabase.rpc('start_consultation_session', {
      session_uuid: session.id
    });

    if (error) {
      console.error('❌ [SessionManagement] Database function error:', error);
      throw error;
    }

    if (!data?.success) {
      console.error('❌ [SessionManagement] Function returned error:', data?.error);
      throw new Error(data?.error || 'Failed to start session');
    }

    console.log('✅ [SessionManagement] Session started successfully via database function');

    // Return updated session object
    const updatedSession = {
      ...session,
      status: 'in_progress' as const,
      started_at: new Date().toISOString()
    };

    return updatedSession;
  } catch (error) {
    console.error('💥 [SessionManagement] Fatal error starting session:', error);
    
    // Fallback to direct update if function fails
    console.log('🔄 [SessionManagement] Attempting fallback direct update');
    
    const { error: updateError } = await supabase
      .from('consultation_sessions')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('❌ [SessionManagement] Fallback update failed:', updateError);
      throw updateError;
    }

    console.log('✅ [SessionManagement] Fallback update successful');
    
    return {
      ...session,
      status: 'in_progress' as const,
      started_at: new Date().toISOString()
    };
  }
};

export const endConsultationSession = async (session: ConsultationSession): Promise<ConsultationSession> => {
  const endTime = new Date().toISOString();
  const startTime = session.started_at ? new Date(session.started_at) : new Date();
  const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

  console.log('🏁 [SessionManagement] Ending session:', session.id);

  const { error } = await supabase
    .from('consultation_sessions')
    .update({
      status: 'completed',
      ended_at: endTime,
      duration_minutes: duration,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('❌ [SessionManagement] Error ending session:', error);
    throw error;
  }

  console.log('✅ [SessionManagement] Session ended successfully');

  return {
    ...session,
    status: 'completed',
    ended_at: endTime,
    duration_minutes: duration
  };
};
