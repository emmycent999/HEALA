
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  physician_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  distance_km?: number;
}

interface AppointmentBookingProps {
  patientId?: string; // For agent booking
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ patientId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedPhysician, setSelectedPhysician] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');

  const specialties = [
    'General Practice', 'Internal Medicine', 'Cardiology', 'Dermatology',
    'Emergency Medicine', 'Family Medicine', 'Gastroenterology', 'Neurology',
    'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  useEffect(() => {
    // Load available physicians on component mount
    fetchAvailablePhysicians();
  }, []);

  const fetchAvailablePhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      
      if (error) {
        console.error('Error fetching physicians:', error);
        return;
      }

      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const searchPhysicians = async () => {
    if (!searchLocation.trim()) {
      toast({
        title: "Location Required",
        description: "Please enter a location to search for physicians.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, using default coordinates for Lagos, Nigeria
      const defaultLat = 6.5244;
      const defaultLng = 3.3792;

      const { data, error } = await supabase.rpc('get_nearby_physicians', {
        patient_lat: defaultLat,
        patient_lng: defaultLng,
        search_radius_km: 50,
        specialty_filter: selectedSpecialty === 'all' ? null : selectedSpecialty
      });

      if (error) {
        console.error('Error searching physicians:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for physicians. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setPhysicians(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: "No Physicians Found",
          description: "No physicians found in your area. Showing all available physicians.",
        });
        fetchAvailablePhysicians();
      }

    } catch (error) {
      console.error('Error searching physicians:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for physicians.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBookingLimit = async (userId: string) => {
    if (profile?.subscription_plan !== 'basic') {
      return true; // No limit for premium/enterprise
    }

    try {
      const { data, error } = await supabase.rpc('check_monthly_booking_limit', {
        patient_uuid: userId
      });

      if (error) {
        console.error('Error checking booking limit:', error);
        return true; // Allow booking if check fails
      }

      return data < 3; // Basic plan allows 3 bookings per month
    } catch (error) {
      console.error('Error checking booking limit:', error);
      return true;
    }
  };

  const bookAppointment = async () => {
    const effectiveUserId = patientId || user?.id;
    
    if (!effectiveUserId || !selectedPhysician || !appointmentDate || !appointmentTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check booking limit for patients (not for agent bookings)
    if (!patientId && !(await checkBookingLimit(effectiveUserId))) {
      toast({
        title: "Booking Limit Reached",
        description: "You've reached your monthly booking limit. Upgrade to premium for unlimited bookings.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get physician's hospital ID
      const { data: physicianData } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', selectedPhysician)
        .single();

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: effectiveUserId,
          physician_id: selectedPhysician,
          hospital_id: physicianData?.hospital_id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          notes: notes.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification for hospital admin if hospital_id exists
      if (physicianData?.hospital_id) {
        const { data: hospitalAdmins } = await supabase
          .from('profiles')
          .select('id')
          .eq('hospital_id', physicianData.hospital_id)
          .eq('role', 'hospital_admin');

        if (hospitalAdmins && hospitalAdmins.length > 0) {
          await supabase.from('notifications').insert(
            hospitalAdmins.map(admin => ({
              user_id: admin.id,
              title: 'New Appointment Booked',
              message: `A new appointment has been booked at your hospital.`,
              type: 'appointment'
            }))
          );
        }
      }

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully booked.",
      });

      // Reset form
      setSelectedPhysician('');
      setAppointmentDate('');
      setAppointmentTime('');
      setNotes('');

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Book Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Search Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="Enter city or area"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={searchPhysicians} disabled={loading} className="w-full">
            {loading ? 'Searching...' : 'Search Physicians'}
          </Button>
        </div>

        {/* Physician Selection */}
        <div>
          <Label htmlFor="physician">Select Physician</Label>
          <Select value={selectedPhysician} onValueChange={setSelectedPhysician}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a physician" />
            </SelectTrigger>
            <SelectContent>
              {physicians.map((physician) => (
                <SelectItem key={physician.physician_id} value={physician.physician_id}>
                  <div className="flex flex-col">
                    <span>Dr. {physician.first_name} {physician.last_name}</span>
                    <span className="text-sm text-gray-500">
                      {physician.specialization} • {physician.hospital_name}
                      {physician.distance_km && ` • ${physician.distance_km}km away`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Appointment Date</Label>
            <Input
              id="date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <Label htmlFor="time">Appointment Time</Label>
            <Input
              id="time"
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Input
            id="notes"
            placeholder="Any specific concerns or requests"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={bookAppointment} disabled={loading} className="w-full">
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </CardContent>
    </Card>
  );
};
