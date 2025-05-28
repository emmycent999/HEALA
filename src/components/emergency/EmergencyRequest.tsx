
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ambulance, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const EmergencyRequest: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    emergencyType: '',
    pickupAddress: '',
    destinationAddress: '',
    contactPhone: '',
    description: ''
  });

  const emergencyTypes = [
    'Medical Emergency',
    'Cardiac Event',
    'Respiratory Distress',
    'Trauma/Injury',
    'Stroke',
    'Overdose',
    'Psychiatric Emergency',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ambulance_requests')
        .insert({
          patient_id: user.id,
          emergency_type: formData.emergencyType,
          pickup_address: formData.pickupAddress,
          destination_address: formData.destinationAddress,
          contact_phone: formData.contactPhone,
          description: formData.description,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Emergency Request Submitted",
        description: "Help is on the way! You will be contacted shortly.",
      });

      // Reset form
      setFormData({
        emergencyType: '',
        pickupAddress: '',
        destinationAddress: '',
        contactPhone: '',
        description: ''
      });

    } catch (error) {
      console.error('Error submitting emergency request:', error);
      toast({
        title: "Error",
        description: "Failed to submit emergency request. Please call 911 directly.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>For life-threatening emergencies, call 911 immediately.</strong> This service is for non-critical emergency transport requests.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ambulance className="w-5 h-5" />
            Request Emergency Transport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="emergencyType">Emergency Type</Label>
              <Select 
                value={formData.emergencyType} 
                onValueChange={(value) => setFormData({ ...formData, emergencyType: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  {emergencyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                placeholder="Enter full pickup address"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="destinationAddress">Destination (Hospital/Medical Facility)</Label>
              <Input
                id="destinationAddress"
                placeholder="Preferred hospital or leave blank for nearest"
                value={formData.destinationAddress}
                onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                placeholder="Phone number for emergency contact"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the emergency situation, symptoms, or special requirements"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !formData.emergencyType || !formData.pickupAddress || !formData.contactPhone}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Submitting Request...' : 'Request Emergency Transport'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Phone className="w-8 h-8 mx-auto text-red-600" />
            <h3 className="font-semibold text-red-600">Emergency Contacts</h3>
            <p className="text-sm text-gray-600">Emergency Services: 911</p>
            <p className="text-sm text-gray-600">Poison Control: 1-800-222-1222</p>
            <p className="text-sm text-gray-600">Mental Health Crisis: 988</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
