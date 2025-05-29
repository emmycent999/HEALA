
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPin, User, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  physician_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  distance_km: number;
}

export const AppointmentBooking = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [monthlyBookings, setMonthlyBookings] = useState(0);
  const [searchRadius, setSearchRadius] = useState(50);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  const specialties = [
    'General Practice', 'Cardiology', 'Dermatology', 'Endocrinology',
    'Gastroenterology', 'Neurology', 'Oncology', 'Orthopedics',
    'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  useEffect(() => {
    if (user) {
      checkMonthlyBookings();
    }
  }, [user]);

  const checkMonthlyBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('check_monthly_booking_limit', {
        patient_uuid: user.id
      });
      
      if (error) throw error;
      setMonthlyBookings(data || 0);
    } catch (error) {
      console.error('Error checking monthly bookings:', error);
    }
  };

  const searchPhysicians = async () => {
    if (!searchLocation) {
      toast({
        title: "Location Required",
        description: "Please enter your location to search for physicians.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For demo purposes, using fixed coordinates for Los Angeles
      // In a real app, you'd geocode the search location
      const demoLat = 34.0522;
      const demoLng = -118.2437;

      const { data, error } = await supabase.rpc('get_nearby_physicians', {
        patient_lat: demoLat,
        patient_lng: demoLng,
        search_radius_km: searchRadius,
        specialty_filter: specialty === 'all' ? null : specialty
      });

      if (error) throw error;
      setPhysicians(data || []);

      if (data?.length === 0) {
        toast({
          title: "No physicians found",
          description: "Try expanding your search radius or removing specialty filters.",
        });
      }
    } catch (error) {
      console.error('Error searching physicians:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for physicians. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async () => {
    if (!user || !selectedPhysician || !selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Information",
        description: "Please select a physician, date, and time.",
        variant: "destructive"
      });
      return;
    }

    // Check monthly limit for basic plan users
    if (profile?.subscription_plan === 'basic' && monthlyBookings >= 3) {
      toast({
        title: "Booking Limit Reached",
        description: "You have reached your monthly limit of 3 appointments. Upgrade to premium for unlimited bookings.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          physician_id: selectedPhysician.physician_id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Booked!",
        description: `Your appointment with Dr. ${selectedPhysician.first_name} ${selectedPhysician.last_name} is pending confirmation.`,
      });

      // Reset form
      setSelectedPhysician(null);
      setSelectedDate(undefined);
      setSelectedTime('');
      checkMonthlyBookings();
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

  const canBookMore = profile?.subscription_plan !== 'basic' || monthlyBookings < 3;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Book Appointment
          </CardTitle>
          {profile?.subscription_plan === 'basic' && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              Basic Plan: {monthlyBookings}/3 appointments used this month
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Your Location</Label>
              <Input
                id="location"
                placeholder="Enter your city or ZIP code"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="specialty">Specialty (Optional)</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {specialties.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="radius">Search Radius (km)</Label>
            <Select value={searchRadius.toString()} onValueChange={(value) => setSearchRadius(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 km</SelectItem>
                <SelectItem value="25">25 km</SelectItem>
                <SelectItem value="50">50 km</SelectItem>
                <SelectItem value="100">100 km</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={searchPhysicians} disabled={loading} className="w-full">
            {loading ? 'Searching...' : 'Search Physicians'}
          </Button>
        </CardContent>
      </Card>

      {physicians.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Physicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {physicians.map((physician) => (
                <div
                  key={physician.physician_id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPhysician?.physician_id === physician.physician_id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPhysician(physician)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">
                        Dr. {physician.first_name} {physician.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{physician.specialization}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {physician.hospital_name}
                      </p>
                    </div>
                    <Badge variant="secondary">{physician.distance_km} km away</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPhysician && canBookMore && (
        <Card>
          <CardHeader>
            <CardTitle>Select Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Select Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={bookAppointment}
              disabled={loading || !selectedDate || !selectedTime}
              className="w-full"
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedPhysician && !canBookMore && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-orange-600">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-semibold">Monthly Limit Reached</h3>
              <p className="text-sm">You have used all 3 appointments for this month. Upgrade to premium for unlimited bookings.</p>
              <Button className="mt-4" variant="outline">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
