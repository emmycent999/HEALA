
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
  hospital_id: string;
}

export const EnhancedAppointmentBooking: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [filteredPhysicians, setFilteredPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [formData, setFormData] = useState({
    physician_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  });

  useEffect(() => {
    fetchHospitals();
    fetchPhysicians();
  }, []);

  useEffect(() => {
    filterPhysicians();
  }, [searchTerm, selectedHospital, selectedLocation, physicians]);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      if (error) throw error;
      
      const physiciansWithHospital = (data || []).map((physician: any) => ({
        ...physician,
        hospital_name: physician.hospital_name || 'Independent Practice'
      }));
      
      setPhysicians(physiciansWithHospital);
      setFilteredPhysicians(physiciansWithHospital);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const filterPhysicians = () => {
    let filtered = physicians;

    // Filter by search term (name or specialization)
    if (searchTerm) {
      filtered = filtered.filter(physician =>
        `${physician.first_name} ${physician.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        physician.specialization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by hospital
    if (selectedHospital) {
      filtered = filtered.filter(physician => physician.hospital_id === selectedHospital);
    }

    // Filter by location (city/state)
    if (selectedLocation) {
      const selectedHospitalData = hospitals.find(h => h.id === selectedLocation);
      if (selectedHospitalData) {
        filtered = filtered.filter(physician => physician.hospital_id === selectedLocation);
      }
    }

    setFilteredPhysicians(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Check monthly booking limit
      const { data: limitCheck, error: limitError } = await supabase
        .rpc('check_monthly_booking_limit', { patient_uuid: user.id });

      if (limitError) throw limitError;

      if (limitCheck >= 5) {
        toast({
          title: "Booking Limit Reached",
          description: "You have reached your monthly appointment booking limit (5 appointments).",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          physician_id: formData.physician_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          notes: formData.reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully booked.",
      });

      // Reset form
      setFormData({
        physician_id: '',
        appointment_date: '',
        appointment_time: '',
        reason: ''
      });

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
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
          <Calendar className="w-6 h-6" />
          <span>Book Appointment</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search and Filter Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">Find a Physician</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search by Name or Specialty</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search physicians..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hospital">Filter by Hospital</Label>
                <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                  <SelectTrigger>
                    <SelectValue placeholder="All hospitals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All hospitals</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Filter by Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {hospitals.map((hospital) => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        {hospital.city}, {hospital.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Physician Selection */}
          <div className="space-y-2">
            <Label htmlFor="physician_id">Select Physician *</Label>
            <Select value={formData.physician_id} onValueChange={(value) => handleInputChange('physician_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a physician" />
              </SelectTrigger>
              <SelectContent>
                {filteredPhysicians.map((physician) => (
                  <SelectItem key={physician.id} value={physician.id}>
                    <div className="flex flex-col">
                      <span>Dr. {physician.first_name} {physician.last_name}</span>
                      <span className="text-sm text-gray-500">
                        {physician.specialization} • {physician.hospital_name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment_time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => handleInputChange('appointment_time', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reason for Visit */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="Describe your symptoms or reason for the appointment"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            disabled={loading}
          >
            {loading ? 'Booking Appointment...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
