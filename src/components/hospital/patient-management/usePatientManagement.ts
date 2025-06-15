
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Patient, PatientFormData } from './types';

export const usePatientManagement = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('hospital_patients')
        .select(`
          *,
          patient:profiles!hospital_patients_patient_id_fkey(
            first_name,
            last_name,
            phone,
            email
          ),
          physician:profiles!hospital_patients_assigned_physician_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData: Patient[] = (data || []).map(entry => {
        const patient = entry.patient || { first_name: '', last_name: '', phone: '', email: '' };
        const physician = entry.physician || { first_name: '', last_name: '' };
        
        return {
          id: entry.id,
          patient_id: entry.patient_id,
          hospital_id: entry.hospital_id,
          status: entry.status as 'active' | 'discharged' | 'admitted' | 'emergency',
          admission_date: entry.admission_date,
          discharge_date: entry.discharge_date,
          room_number: entry.room_number,
          assigned_physician_id: entry.assigned_physician_id,
          notes: entry.notes,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          patient_name: `${patient.first_name} ${patient.last_name}`.trim() || 'Unknown Patient',
          patient_phone: patient.phone || '',
          patient_email: patient.email || '',
          assigned_physician_name: physician.first_name && physician.last_name 
            ? `Dr. ${physician.first_name} ${physician.last_name}` 
            : undefined
        };
      });

      setPatients(formattedData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPatient = async (patientData: PatientFormData) => {
    if (!profile?.hospital_id) return;

    try {
      const { error } = await supabase
        .from('hospital_patients')
        .insert({
          ...patientData,
          hospital_id: profile.hospital_id,
          admission_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient added successfully.",
      });
      
      fetchPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient.",
        variant: "destructive"
      });
    }
  };

  const updatePatientStatus = async (patientId: string, newStatus: string, additionalData?: Partial<PatientFormData>) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      if (newStatus === 'discharged') {
        updateData.discharge_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('hospital_patients')
        .update(updateData)
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Patient status updated to ${newStatus}.`,
      });
      
      fetchPatients();
    } catch (error) {
      console.error('Error updating patient status:', error);
      toast({
        title: "Error",
        description: "Failed to update patient status.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchPatients();
      
      const channel = supabase
        .channel('hospital_patients_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'hospital_patients',
          filter: `hospital_id=eq.${profile.hospital_id}`
        }, () => {
          fetchPatients();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  return {
    patients,
    loading,
    addPatient,
    updatePatientStatus,
    fetchPatients
  };
};
