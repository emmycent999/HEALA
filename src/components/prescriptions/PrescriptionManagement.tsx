
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, MapPin, RefreshCw, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Prescription {
  id: string;
  patient_id: string;
  physician_id: string;
  appointment_id?: string;
  prescription_data: any;
  status: 'pending' | 'approved' | 'dispensed' | 'completed' | 'cancelled';
  pharmacy_id?: string;
  dispensed_at?: string;
  repeat_allowed: boolean;
  repeat_count: number;
  max_repeats: number;
  created_at: string;
  updated_at: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
  pharmacy?: {
    name: string;
    address: string;
    phone: string;
  };
}

export const PrescriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      console.log('Fetching prescriptions for patient:', user?.id);
      
      // Get prescriptions with physician and pharmacy information
      const { data: prescriptionsData, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          physician:profiles!prescriptions_physician_id_fkey(
            first_name,
            last_name,
            specialization
          ),
          pharmacy:healthcare_providers(name, address, phone)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        throw error;
      }
      
      console.log('Fetched prescriptions with relations:', prescriptionsData);
      
      // Validate and transform data structure
      const validPrescriptions = (prescriptionsData || []).map((item: any) => ({
        id: item.id,
        patient_id: item.patient_id,
        physician_id: item.physician_id,
        appointment_id: item.appointment_id,
        prescription_data: item.prescription_data || {},
        status: item.status || 'pending',
        pharmacy_id: item.pharmacy_id,
        dispensed_at: item.dispensed_at,
        repeat_allowed: Boolean(item.repeat_allowed),
        repeat_count: item.repeat_count || 0,
        max_repeats: item.max_repeats || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
        physician: item.physician ? {
          first_name: item.physician.first_name || 'Unknown',
          last_name: item.physician.last_name || 'Doctor',
          specialization: item.physician.specialization
        } : {
          first_name: 'Unknown',
          last_name: 'Doctor',
          specialization: undefined
        },
        pharmacy: item.pharmacy
      }));
      
      console.log('Processed prescriptions:', validPrescriptions);
      setPrescriptions(validPrescriptions as Prescription[]);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestRepeat = async (prescriptionId: string) => {
    try {
      const prescription = prescriptions.find(p => p.id === prescriptionId);
      if (!prescription) return;

      if (prescription.repeat_count >= prescription.max_repeats) {
        toast({
          title: "Repeat Limit Reached",
          description: "You have reached the maximum number of repeats for this prescription.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('prescriptions')
        .update({
          repeat_count: prescription.repeat_count + 1,
          status: 'pending'
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      toast({
        title: "Repeat Requested",
        description: "Your repeat prescription has been requested successfully."
      });

      fetchPrescriptions();
    } catch (error) {
      console.error('Error requesting repeat:', error);
      toast({
        title: "Error",
        description: "Failed to request repeat prescription",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMedicationsList = (prescriptionData: any) => {
    if (prescriptionData.medications && Array.isArray(prescriptionData.medications)) {
      return prescriptionData.medications;
    }
    return [];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading prescriptions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            My Prescriptions ({prescriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No prescriptions found</p>
              <p className="text-sm mt-2">Your prescriptions from doctors will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => {
                const medications = getMedicationsList(prescription.prescription_data);
                
                return (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">
                            Dr. {prescription.physician?.first_name} {prescription.physician?.last_name}
                          </span>
                          {prescription.physician?.specialization && (
                            <span className="text-sm text-gray-500">
                              ({prescription.physician.specialization})
                            </span>
                          )}
                        </div>
                        <Badge className={getStatusColor(prescription.status)}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {medications.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-2">Medications:</h5>
                        <div className="space-y-2">
                          {medications.map((medication: any, index: number) => (
                            <div key={index} className="bg-gray-50 p-3 rounded">
                              <div className="font-medium">{medication.medication_name}</div>
                              <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-1">
                                <span>Dosage: {medication.dosage}</span>
                                <span>Frequency: {medication.frequency}</span>
                                <span>Duration: {medication.duration}</span>
                              </div>
                              {medication.instructions && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Instructions: {medication.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {prescription.pharmacy && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        {prescription.pharmacy.name} - {prescription.pharmacy.address}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {prescription.repeat_allowed && (
                          <span>
                            Repeats: {prescription.repeat_count}/{prescription.max_repeats}
                          </span>
                        )}
                      </div>
                      
                      {prescription.repeat_allowed && 
                       prescription.repeat_count < prescription.max_repeats &&
                       prescription.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => requestRepeat(prescription.id)}
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Request Repeat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
