
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, DollarSign, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HealthcareProvider {
  id: string;
  name: string;
  type: 'clinic' | 'hospital' | 'pharmacy';
  address: string;
  city: string;
  state: string;
  phone?: string;
  services: string[];
  operating_hours: any;
  distance_km?: number;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name?: string;
}

export const EnhancedAppointmentBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedPhysician, setSelectedPhysician] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('consultation');
  const [notes, setNotes] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    fetchHealthcareProviders();
    fetchPhysicians();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  };

  const fetchHealthcareProviders = async () => {
    try {
      // Use hospitals table as a fallback since healthcare_providers might not be in types yet
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform hospital data to match HealthcareProvider interface
      const transformedData = (data || []).map((hospital: any) => ({
        id: hospital.id,
        name: hospital.name,
        type: 'hospital' as const,
        address: hospital.address || '',
        city: hospital.city || '',
        state: hospital.state || '',
        phone: hospital.phone,
        services: [],
        operating_hours: {},
        distance_km: 0
      }));
      
      setProviders(transformedData);
    } catch (error) {
      console.error('Error fetching healthcare providers:', error);
    }
  };

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      if (error) throw error;
      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const bookAppointment = async () => {
    if (!selectedPhysician || !appointmentDate || !appointmentTime) {
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
        .from('appointments')
        .insert({
          patient_id: user?.id,
          physician_id: selectedPhysician,
          hospital_id: selectedProvider || null,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes: notes || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been scheduled successfully.",
      });

      // Reset form
      setSelectedProvider('');
      setSelectedPhysician('');
      setAppointmentDate('');
      setAppointmentTime('');
      setAppointmentType('consultation');
      setNotes('');
      setConsultationFee(0);

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const appointmentTypes = [
    { value: 'consultation', label: 'General Consultation' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'specialist', label: 'Specialist Consultation' },
    { value: 'routine_checkup', label: 'Routine Checkup' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book Enhanced Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Healthcare Provider (Optional)</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {provider.city}, {provider.state}
                            {provider.distance_km && provider.distance_km > 0 && (
                              <Badge variant="outline" className="ml-2">
                                {provider.distance_km}km away
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline">
                          <Building2 className="w-3 h-3 mr-1" />
                          {provider.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="physician">Physician *</Label>
              <Select value={selectedPhysician} onValueChange={setSelectedPhysician}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a physician" />
                </SelectTrigger>
                <SelectContent>
                  {physicians.map((physician) => (
                    <SelectItem key={physician.id} value={physician.id}>
                      <div>
                        <div className="font-medium">
                          Dr. {physician.first_name} {physician.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {physician.specialization}
                          {physician.hospital_name && ` - ${physician.hospital_name}`}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="appointment-type">Appointment Type</Label>
              <Select value={appointmentType} onValueChange={setAppointmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Appointment Date *</Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <Label htmlFor="time">Appointment Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fee">Consultation Fee (₦)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="fee"
                  type="number"
                  placeholder="0"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any specific concerns or information you'd like to share..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={bookAppointment} disabled={loading} className="w-full">
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </CardContent>
    </Card>
  );
};
