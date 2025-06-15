import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WaitlistEntry {
  id: string;
  patient_id: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reason: string;
  estimated_wait_time: number;
  status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  patient_name?: string;
  patient_phone?: string;
}

export const PatientWaitlistManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchWaitlist();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('waitlist_updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'patient_waitlist',
          filter: `hospital_id=eq.${profile.hospital_id}`
        }, () => {
          fetchWaitlist();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, profile]);

  const fetchWaitlist = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('patient_waitlist')
        .select(`
          *,
          profiles!patient_waitlist_patient_id_fkey (
            first_name,
            last_name,
            phone
          )
        `)
        .eq('hospital_id', profile.hospital_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData: WaitlistEntry[] = (data || []).map(entry => ({
        id: entry.id,
        patient_id: entry.patient_id,
        department: entry.department,
        priority: entry.priority as 'low' | 'medium' | 'high' | 'urgent',
        reason: entry.reason,
        estimated_wait_time: entry.estimated_wait_time || 0,
        status: entry.status as 'waiting' | 'called' | 'in_progress' | 'completed' | 'cancelled',
        created_at: entry.created_at,
        patient_name: entry.profiles 
          ? `${entry.profiles.first_name} ${entry.profiles.last_name}`
          : 'Unknown Patient',
        patient_phone: entry.profiles?.phone || ''
      }));

      setWaitlist(formattedData);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast({
        title: "Error",
        description: "Failed to load waitlist.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEntryStatus = async (entryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patient_waitlist')
        .update({ 
          status: newStatus,
          called_at: newStatus === 'called' ? new Date().toISOString() : null,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Patient status updated to ${newStatus}.`,
      });
      
      fetchWaitlist();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update patient status.",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'called':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const departments = [...new Set(waitlist.map(entry => entry.department))];
  const filteredWaitlist = selectedDepartment === 'all' 
    ? waitlist 
    : waitlist.filter(entry => entry.department === selectedDepartment);

  const waitingCount = waitlist.filter(entry => entry.status === 'waiting').length;
  const averageWaitTime = waitlist.length > 0 
    ? Math.round(waitlist.reduce((acc, entry) => acc + entry.estimated_wait_time, 0) / waitlist.length)
    : 0;

  if (loading) {
    return <div className="p-6">Loading waitlist...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Patient Waitlist</h2>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add to Waitlist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Patients Waiting</p>
                <p className="text-2xl font-bold">{waitingCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Wait Time</p>
                <p className="text-2xl font-bold">{averageWaitTime}min</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold">{waitlist.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Filter */}
      <div className="flex gap-2">
        <Button 
          variant={selectedDepartment === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedDepartment('all')}
        >
          All Departments
        </Button>
        {departments.map(dept => (
          <Button 
            key={dept}
            variant={selectedDepartment === dept ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDepartment(dept)}
          >
            {dept}
          </Button>
        ))}
      </div>

      {/* Waitlist */}
      <Card>
        <CardHeader>
          <CardTitle>Current Waitlist</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredWaitlist.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients in the waitlist</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWaitlist.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{entry.patient_name}</h4>
                        <p className="text-sm text-gray-600">{entry.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(entry.priority)}>
                        {entry.priority}
                      </Badge>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="text-sm">{entry.reason}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimated Wait</p>
                      <p className="text-sm">{entry.estimated_wait_time} minutes</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Arrival Time</p>
                      <p className="text-sm">{new Date(entry.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {entry.status === 'waiting' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => updateEntryStatus(entry.id, 'called')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call Patient
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateEntryStatus(entry.id, 'in_progress')}
                        >
                          Start Treatment
                        </Button>
                      </>
                    )}
                    {entry.status === 'called' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateEntryStatus(entry.id, 'in_progress')}
                      >
                        Start Treatment
                      </Button>
                    )}
                    {entry.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        onClick={() => updateEntryStatus(entry.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => updateEntryStatus(entry.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
