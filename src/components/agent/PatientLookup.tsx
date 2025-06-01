
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PatientInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

interface PatientLookupProps {
  onPatientFound: (patient: PatientInfo) => void;
}

export const PatientLookup: React.FC<PatientLookupProps> = ({ onPatientFound }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchPatient = async () => {
    if (!searchEmail && !searchPhone) {
      toast({
        title: "Error",
        description: "Please enter either email or phone number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, city, state')
        .eq('role', 'patient');

      if (searchEmail) {
        query = query.eq('email', searchEmail.trim());
      } else if (searchPhone) {
        query = query.eq('phone', searchPhone.trim());
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Patient Not Found",
            description: "No patient found with the provided information.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        setPatient(null);
        return;
      }

      setPatient(data);
      onPatientFound(data);
      toast({
        title: "Patient Found",
        description: `Found ${data.first_name} ${data.last_name}`,
      });

    } catch (error) {
      console.error('Error searching patient:', error);
      toast({
        title: "Error",
        description: "Failed to search for patient.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchEmail('');
    setSearchPhone('');
    setPatient(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Patient Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Search by Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="patient@example.com"
              value={searchEmail}
              onChange={(e) => {
                setSearchEmail(e.target.value);
                setSearchPhone(''); // Clear phone when typing email
              }}
            />
          </div>
          <div>
            <Label htmlFor="phone">Search by Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 800 000 0000"
              value={searchPhone}
              onChange={(e) => {
                setSearchPhone(e.target.value);
                setSearchEmail(''); // Clear email when typing phone
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={searchPatient} disabled={loading}>
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Searching...' : 'Search Patient'}
          </Button>
          <Button variant="outline" onClick={clearSearch}>
            Clear
          </Button>
        </div>

        {patient && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Patient Found</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>{patient.first_name} {patient.last_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{patient.email}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.city && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {patient.city}, {patient.state}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
