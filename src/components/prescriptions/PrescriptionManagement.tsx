
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, MapPin, RefreshCw, User, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PrescriptionStatus = 'pending' | 'approved' | 'dispensed' | 'completed' | 'cancelled';

interface PhysicianInfo {
  first_name: string;
  last_name: string;
  specialization?: string;
}

interface PharmacyInfo {
  name: string;
  address: string;
  phone: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  physician_id: string;
  appointment_id?: string;
  prescription_data: any;
  status: PrescriptionStatus;
  pharmacy_id?: string;
  dispensed_at?: string;
  repeat_allowed: boolean;
  repeat_count: number;
  max_repeats: number;
  created_at: string;
  updated_at: string;
  physician?: PhysicianInfo;
  pharmacy?: PharmacyInfo;
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
      
      // Get prescriptions first
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (prescriptionsError) {
        console.error('Error fetching prescriptions:', prescriptionsError);
        throw prescriptionsError;
      }

      console.log('Fetched prescriptions:', prescriptionsData);

      if (!prescriptionsData || prescriptionsData.length === 0) {
        setPrescriptions([]);
        return;
      }

      // Get unique physician and pharmacy IDs
      const physicianIds = [...new Set(prescriptionsData.map(p => p.physician_id))];
      const pharmacyIds = [...new Set(prescriptionsData.map(p => p.pharmacy_id).filter(Boolean))];

      // Fetch physician profiles
      const { data: physicians } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .in('id', physicianIds);

      // Fetch pharmacy data
      const { data: pharmacies } = pharmacyIds.length > 0 ? await supabase
        .from('healthcare_providers')
        .select('id, name, address, phone')
        .in('id', pharmacyIds) : { data: [] };

      // Combine data and ensure proper typing
      const enrichedPrescriptions: Prescription[] = prescriptionsData.map(prescription => {
        const physician = physicians?.find(p => p.id === prescription.physician_id);
        const pharmacy = pharmacies?.find(p => p.id === prescription.pharmacy_id);

        return {
          ...prescription,
          status: prescription.status as PrescriptionStatus, // Type assertion for status
          physician: physician ? {
            first_name: physician.first_name || 'Unknown',
            last_name: physician.last_name || 'Doctor',
            specialization: physician.specialization
          } : {
            first_name: 'Unknown',
            last_name: 'Doctor',
            specialization: undefined
          },
          pharmacy: pharmacy
        };
      });

      console.log('Enriched prescriptions:', enrichedPrescriptions);
      setPrescriptions(enrichedPrescriptions);
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

  const getStatusColor = (status: PrescriptionStatus) => {
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
                          {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {new Date(prescription.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {medications.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-sm mb-2">Medications ({medications.length}):</h5>
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
                        {prescription.status === 'pending' && (
                          <span className="text-orange-600 font-medium">
                            Waiting for pharmacy approval
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
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
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.print()}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Print
                        </Button>
                      </div>
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
