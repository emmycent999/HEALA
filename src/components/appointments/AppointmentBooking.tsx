
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  hospital_name: string;
}

interface AppointmentBookingProps {
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ 
  patientId, 
  patientName, 
  patientEmail 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    physicianId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const effectivePatientId = patientId || user?.id;

  useEffect(() => {
    fetchPhysicians();
  }, []);

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase.rpc('get_available_physicians');
      
      if (error) throw error;
      
      const formattedPhysicians = (data || []).map((physician: any) => ({
        id: physician.id,
        first_name: physician.first_name || 'Unknown',
        last_name: physician.last_name || '',
        specialization: physician.specialization || 'General',
        hospital_name: physician.hospital_name || 'Unknown Hospital'
      }));
      
      setPhysicians(formattedPhysicians);
    } catch (error) {
      console.error('Error fetching physicians:', error);
      toast({
        title: "Error",
        description: "Failed to load physicians.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectivePatientId) {
      toast({
        title: "Error",
        description: "Patient ID is required to book appointment.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: effectivePatientId,
          physician_id: formData.physicianId,
          appointment_date: formData.appointmentDate,
          appointment_time: formData.appointmentTime,
          notes: formData.notes,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Appointment Booked",
        description: `Appointment has been successfully booked${patientName ? ` for ${patientName}` : ''}.`,
      });

      // Reset form
      setFormData({
        physicianId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
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
        {(patientName || patientEmail) && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="w-4 h-4" />
              <span className="font-medium">
                Booking for: {patientName || patientEmail}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="physician">Select Physician</Label>
            <Select value={formData.physicianId} onValueChange={(value) => setFormData({ ...formData, physicianId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a physician" />
              </SelectTrigger>
              <SelectContent>
                {physicians.map((physician) => (
                  <SelectItem key={physician.id} value={physician.id}>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      <span>
                        Dr. {physician.first_name} {physician.last_name} - {physician.specialization}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Appointment Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <Label htmlFor="time">Appointment Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific concerns or notes for the physician"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Booking...' : 'Book Appointment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
