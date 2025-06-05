
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, MapPin, Clock, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const TransportBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pickup_address: '',
    destination_address: '',
    scheduled_time: '',
    transport_type: 'standard',
    notes: ''
  });

  const transportTypes = [
    { value: 'standard', label: 'Standard Car', price: 2000 },
    { value: 'premium', label: 'Premium Car', price: 3500 },
    { value: 'wheelchair', label: 'Wheelchair Accessible', price: 4000 },
    { value: 'ambulance', label: 'Medical Transport', price: 5000 }
  ];

  const selectedTransportType = transportTypes.find(t => t.value === formData.transport_type);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBookTransport = async () => {
    if (!user) return;

    if (!formData.pickup_address || !formData.destination_address || !formData.scheduled_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transport_bookings')
        .insert({
          patient_id: user.id,
          pickup_address: formData.pickup_address,
          destination_address: formData.destination_address,
          scheduled_time: formData.scheduled_time,
          transport_type: formData.transport_type,
          amount: selectedTransportType?.price || 2000,
          notes: formData.notes,
          status: 'pending',
          payment_status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Transport Booked",
        description: "Your transport has been successfully booked. You will receive confirmation shortly.",
      });

      // Reset form
      setFormData({
        pickup_address: '',
        destination_address: '',
        scheduled_time: '',
        transport_type: 'standard',
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Book Transportation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="pickup"
                placeholder="Enter pickup address"
                value={formData.pickup_address}
                onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="destination"
                placeholder="Enter destination address"
                value={formData.destination_address}
                onChange={(e) => handleInputChange('destination_address', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="datetime">Pickup Date & Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={(e) => handleInputChange('scheduled_time', e.target.value)}
                className="pl-10"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport-type">Transport Type</Label>
            <Select value={formData.transport_type} onValueChange={(value) => handleInputChange('transport_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transport type" />
              </SelectTrigger>
              <SelectContent>
                {transportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.label}</span>
                      <span className="ml-2 text-green-600">₦{type.price.toLocaleString()}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any special requirements or instructions..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
          />
        </div>

        {selectedTransportType && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800">{selectedTransportType.label}</h4>
                <p className="text-sm text-green-600">Estimated fare</p>
              </div>
              <div className="flex items-center gap-1 text-green-800 font-bold">
                <DollarSign className="w-4 h-4" />
                ₦{selectedTransportType.price.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleBookTransport} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Booking...' : 'Book Transportation'}
        </Button>
      </CardContent>
    </Card>
  );
};
