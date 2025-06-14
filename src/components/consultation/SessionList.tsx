
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ConsultationSession } from './types';

interface SessionListProps {
  onSelectSession: (sessionId: string) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ onSelectSession }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const query = profile?.role === 'patient' 
        ? supabase.from('consultation_sessions').select(`
            *,
            physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name, specialization)
          `).eq('patient_id', user.id)
        : supabase.from('consultation_sessions').select(`
            *,
            patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name)
          `).eq('physician_id', user.id);

      const { data, error } = await query
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sessionsWithProfiles = (data || []).map(session => ({
        ...session,
        patient: Array.isArray(session.patient) ? session.patient[0] : session.patient,
        physician: Array.isArray(session.physician) ? session.physician[0] : session.physician
      }));

      setSessions(sessionsWithProfiles);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation sessions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-green-100 text-green-800">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Available Consultation Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No consultation sessions available</p>
            <p className="text-sm">Virtual appointments will appear here once accepted by the physician.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {profile?.role === 'patient' 
                            ? `Dr. ${session.physician?.first_name || 'Unknown'} ${session.physician?.last_name || ''}`
                            : `${session.patient?.first_name || 'Unknown'} ${session.patient?.last_name || ''}`
                          }
                        </span>
                        {getStatusBadge(session.status)}
                      </div>
                    </div>
                    
                    {session.physician?.specialization && profile?.role === 'patient' && (
                      <div className="text-sm text-gray-600 mb-2">
                        Specialization: {session.physician.specialization}
                      </div>
                    )}

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {new Date(session.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        Rate: ₦{session.consultation_rate.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onSelectSession(session.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Video className="w-4 h-4 mr-1" />
                      {session.status === 'in_progress' ? 'Join Session' : 'Start Session'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
