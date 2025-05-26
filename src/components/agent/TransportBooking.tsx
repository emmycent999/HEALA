
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Car, MapPin, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const TransportBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_email: '',
    pickup_address: '',
    destination_address: '',
    transport_type: '',
    scheduled_time: '',
    notes: ''
  });

  const transportTypes = [
    'Standard Ride',
    'Medical Transport',
    'Wheelchair Accessible',
    'Emergency Transport'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Find patient by email
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.patient_email)
        .eq('role', 'patient')
        .single();

      if (patientError || !patientData) {
        toast({
          title: "Patient Not Found",
          description: "No patient found with this email address.",
          variant: "destructive"
        });
        return;
      }

      // Create transport request
      const { error: transportError } = await supabase
        .from('transport_requests')
        .insert({
          patient_id: patientData.id,
          agent_id: user.id,
          pickup_address: formData.pickup_address,
          destination_address: formData.destination_address,
          transport_type: formData.transport_type,
          scheduled_time: formData.scheduled_time,
          status: 'pending'
        });

      if (transportError) throw transportError;

      // Add to assisted patients if not already there
      await supabase
        .from('agent_assisted_patients')
        .upsert({
          agent_id: user.id,
          patient_id: patientData.id,
          assistance_type: 'transport',
          description: `Booked ${formData.transport_type} from ${formData.pickup_address} to ${formData.destination_address}`
        }, { onConflict: 'agent_id,patient_id' });

      toast({
        title: "Transport Booked",
        description: "The transport has been successfully booked for the patient.",
      });

      // Reset form
      setFormData({
        patient_email: '',
        pickup_address: '',
        destination_address: '',
        transport_type: '',
        scheduled_time: '',
        notes: ''
      });

    } catch (error) {
      console.error('Error booking transport:', error);
      toast({
        title: "Error",
        description: "Failed to book transport. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Car className="w-6 h-6" />
          <span>Book Transport for Patient</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patient_email">Patient Email *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="patient_email"
                placeholder="patient@example.com"
                value={formData.patient_email}
                onChange={(e) => handleInputChange('patient_email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_address">Pickup Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="pickup_address"
                placeholder="Enter pickup location"
                value={formData.pickup_address}
                onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination_address">Destination Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="destination_address"
                placeholder="Enter destination"
                value={formData.destination_address}
                onChange={(e) => handleInputChange('destination_address', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport_type">Transport Type *</Label>
            <Select value={formData.transport_type} onValueChange={(value) => handleInputChange('transport_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transport type" />
              </SelectTrigger>
              <SelectContent>
                {transportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_time">Scheduled Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="scheduled_time"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                className="pl-10"
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700" 
            disabled={loading}
          >
            {loading ? 'Booking Transport...' : 'Book Transport'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
