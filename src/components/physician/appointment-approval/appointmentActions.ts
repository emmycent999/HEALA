
import { supabase } from '@/integrations/supabase/client';

interface PendingAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  consultation_type: string;
  notes?: string;
  patient_id: string;
  patient: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export const createConsultationSession = async (appointment: PendingAppointment, userId: string, consultationRate: number) => {
  try {
    console.log('🔄 Creating consultation session for appointment:', appointment.id);
    
    // Use the secure database function for virtual appointments
    if (appointment.consultation_type === 'virtual') {
      console.log('📹 Creating virtual consultation session with room');
      
      const { data: sessionId, error: functionError } = await supabase
        .rpc('create_virtual_consultation_session', {
          appointment_uuid: appointment.id,
          patient_uuid: appointment.patient_id,
          physician_uuid: userId,
          consultation_rate_param: consultationRate || 5000
        });

      if (functionError) {
        console.error('❌ Database function error:', functionError);
        throw functionError;
      }

      // Fetch the created session with related data
      const { data: sessionData, error: fetchError } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name, email),
          physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name)
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching created session:', fetchError);
        throw fetchError;
      }

      console.log('✅ Virtual consultation session created:', sessionData);
      return sessionData;
      
    } else {
      // For non-virtual appointments, create chat session manually
      console.log('💬 Creating chat consultation session');
      
      const sessionData = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        physician_id: userId,
        consultation_rate: consultationRate || 5000,
        session_type: 'chat',
        status: 'scheduled',
        payment_status: 'pending'
      };

      const { data: sessionResult, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert(sessionData)
        .select(`
          *,
          patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name, email),
          physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name)
        `)
        .single();

      if (sessionError) {
        console.error('❌ Error creating chat session:', sessionError);
        throw sessionError;
      }

      console.log('✅ Chat consultation session created:', sessionResult);
      return sessionResult;
    }
  } catch (error) {
    console.error('💥 Error creating consultation session:', error);
    throw error;
  }
};

export const updateAppointmentStatus = async (appointmentId: string, status: 'accepted' | 'rejected') => {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) throw error;
};

export const createPhysicianPatientRelationship = async (physicianId: string, patientId: string) => {
  const { error } = await supabase
    .from('physician_patients')
    .upsert({
      physician_id: physicianId,
      patient_id: patientId,
      status: 'active'
    }, {
      onConflict: 'physician_id,patient_id'
    });

  if (error) throw error;
};

export const createConversation = async (patientId: string, physicianId: string, patientName: string) => {
  const { error } = await supabase
    .from('conversations')
    .insert({
      patient_id: patientId,
      physician_id: physicianId,
      type: 'physician_consultation',
      title: `Virtual Consultation - ${patientName}`,
      status: 'active'
    });

  if (error) throw error;
};
