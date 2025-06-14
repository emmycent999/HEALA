
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
      console.log('Fetching consultation sessions for user:', user.id, 'role:', profile?.role);
      
      // First get the consultation sessions
      const sessionQuery = profile?.role === 'patient' 
        ? supabase.from('consultation_sessions').select('*').eq('patient_id', user.id)
        : supabase.from('consultation_sessions').select('*').eq('physician_id', user.id);

      const { data: sessionsData, error: sessionsError } = await sessionQuery
        .in('status', ['scheduled', 'in_progress'])
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      console.log('Raw sessions data:', sessionsData);

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      // Get related profiles separately
      const sessionsWithProfiles = await Promise.all(
        sessionsData.map(async (session) => {
          const patientQuery = supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', session.patient_id)
            .single();

          const physicianQuery = supabase
            .from('profiles')
            .select('first_name, last_name, specialization')
            .eq('id', session.physician_id)
            .single();

          const [patientResult, physicianResult] = await Promise.all([
            patientQuery,
            physicianQuery
          ]);

          return {
            ...session,
            patient: patientResult.data,
            physician: physicianResult.data
          };
        })
      );

      console.log('Sessions with profiles:', sessionsWithProfiles);
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

  const getButtonText = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    
    if (session.status === 'scheduled') {
      return isPhysician ? 'Start Video Consultation' : 'Wait for Doctor';
    } else if (session.status === 'in_progress') {
      return isPhysician ? 'Join Session' : 'Join Video Call';
    }
    return 'View Session';
  };

  const getButtonVariant = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    
    if (session.status === 'scheduled' && !isPhysician) {
      return 'secondary'; // Disabled look for patients waiting
    }
    if (session.status === 'in_progress') {
      return 'default'; // Active look for in-progress sessions
    }
    return 'default';
  };

  const isButtonDisabled = (session: ConsultationSession) => {
    const isPhysician = profile?.role === 'physician';
    // Patients can't start scheduled sessions, only physicians can
    return session.status === 'scheduled' && !isPhysician;
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
                      variant={getButtonVariant(session)}
                      disabled={isButtonDisabled(session)}
                      className={session.status === 'in_progress' ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      {getButtonText(session)}
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
