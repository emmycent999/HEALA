
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionInputProps {
  patientId?: string;
  appointmentId?: string;
  onPrescriptionAdded?: () => void;
}

interface Medication {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export const PrescriptionInput: React.FC<PrescriptionInputProps> = ({
  patientId,
  appointmentId,
  onPrescriptionAdded
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([{
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }]);
  const [repeatAllowed, setRepeatAllowed] = useState(false);
  const [maxRepeats, setMaxRepeats] = useState(0);
  const [pharmacyId, setPharmacyId] = useState('');

  const addMedication = () => {
    setMedications([...medications, {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !patientId) return;

    setLoading(true);
    try {
      const prescriptionData = {
        medications,
        total_medications: medications.length,
        prescribed_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          physician_id: user.id,
          appointment_id: appointmentId,
          prescription_data: prescriptionData,
          repeat_allowed: repeatAllowed,
          max_repeats: repeatAllowed ? maxRepeats : 0,
          pharmacy_id: pharmacyId || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Prescription Created",
        description: "The prescription has been successfully created for the patient."
      });

      // Reset form
      setMedications([{
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]);
      setRepeatAllowed(false);
      setMaxRepeats(0);
      setPharmacyId('');

      if (onPrescriptionAdded) {
        onPrescriptionAdded();
      }

    } catch (error) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          Create Prescription
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {medications.map((medication, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Medication {index + 1}</h4>
                {medications.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMedication(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`medication_name_${index}`}>Medication Name *</Label>
                  <Input
                    id={`medication_name_${index}`}
                    value={medication.medication_name}
                    onChange={(e) => updateMedication(index, 'medication_name', e.target.value)}
                    placeholder="e.g., Paracetamol"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`dosage_${index}`}>Dosage *</Label>
                  <Input
                    id={`dosage_${index}`}
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`frequency_${index}`}>Frequency *</Label>
                  <Select
                    value={medication.frequency}
                    onValueChange={(value) => updateMedication(index, 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once_daily">Once daily</SelectItem>
                      <SelectItem value="twice_daily">Twice daily</SelectItem>
                      <SelectItem value="three_times_daily">Three times daily</SelectItem>
                      <SelectItem value="four_times_daily">Four times daily</SelectItem>
                      <SelectItem value="as_needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`duration_${index}`}>Duration *</Label>
                  <Input
                    id={`duration_${index}`}
                    value={medication.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    placeholder="e.g., 7 days"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`instructions_${index}`}>Special Instructions</Label>
                <Textarea
                  id={`instructions_${index}`}
                  value={medication.instructions}
                  onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                  placeholder="e.g., Take with food"
                  rows={2}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addMedication}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Medication
          </Button>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Prescription Repeats</Label>
                <p className="text-sm text-gray-500">Patient can request refills</p>
              </div>
              <Switch
                checked={repeatAllowed}
                onCheckedChange={setRepeatAllowed}
              />
            </div>

            {repeatAllowed && (
              <div>
                <Label htmlFor="max_repeats">Maximum Number of Repeats</Label>
                <Input
                  id="max_repeats"
                  type="number"
                  min="1"
                  max="12"
                  value={maxRepeats}
                  onChange={(e) => setMaxRepeats(parseInt(e.target.value) || 0)}
                  placeholder="Enter number of repeats"
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Prescription...' : 'Create Prescription'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
