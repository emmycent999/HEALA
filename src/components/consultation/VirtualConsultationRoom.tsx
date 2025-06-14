import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VirtualConsultationRoomProps {
  sessionId?: string | null;
}

interface ConsultationSession {
  id: string;
  patient_id: string;
  physician_id: string;
  status: string;
  session_type: string;
  consultation_rate: number;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  payment_status: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
  physician?: {
    first_name: string;
    last_name: string;
    specialization?: string;
  };
}

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      // Show available sessions or create new session interface
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === 'in_progress' && session.started_at) {
      interval = setInterval(() => {
        const startTime = new Date(session.started_at!).getTime();
        const now = new Date().getTime();
        const duration = Math.floor((now - startTime) / 1000 / 60);
        setSessionDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);

  const fetchSessionData = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          patient:profiles!consultation_sessions_patient_id_fkey(first_name, last_name),
          physician:profiles!consultation_sessions_physician_id_fkey(first_name, last_name, specialization)
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSession(data);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast({
        title: "Error",
        description: "Failed to load consultation session.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      setSession(prev => prev ? {
        ...prev,
        status: 'in_progress',
        started_at: new Date().toISOString()
      } : null);

      toast({
        title: "Session Started",
        description: "Virtual consultation has begun.",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session.",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = session.started_at ? new Date(session.started_at) : new Date();
      const duration = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          ended_at: endTime,
          duration_minutes: duration
        })
        .eq('id', session.id);

      if (error) throw error;

      // Process payment if not already paid
      if (session.payment_status === 'pending') {
        await processConsultationPayment();
      }

      setSession(prev => prev ? {
        ...prev,
        status: 'completed',
        ended_at: endTime,
        duration_minutes: duration
      } : null);

      toast({
        title: "Session Ended",
        description: `Consultation completed. Duration: ${duration} minutes.`,
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session.",
        variant: "destructive"
      });
    }
  };

  const processConsultationPayment = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.rpc('process_consultation_payment', {
        session_uuid: session.id,
        patient_uuid: session.patient_id,
        physician_uuid: session.physician_id,
        amount: session.consultation_rate
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Payment Processed",
          description: `₦${session.consultation_rate.toLocaleString()} has been deducted from your wallet.`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: "Insufficient wallet balance. Please fund your wallet.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process consultation payment.",
        variant: "destructive"
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading consultation room...</div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Virtual Consultation Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
            <p className="text-gray-600 mb-4">
              Start a virtual consultation by booking an appointment with a physician.
            </p>
            <Button onClick={() => window.location.href = '/patient?tab=appointments'}>
              Book Appointment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600">Session not found or access denied.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Virtual Consultation
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                {connectionStatus}
              </Badge>
              <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                {session.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                {profile?.role === 'patient' ? 'Dr. ' : ''}
                {profile?.role === 'patient' 
                  ? `${session.physician?.first_name || 'Unknown'} ${session.physician?.last_name || ''}`
                  : `${session.patient?.first_name || 'Unknown'} ${session.patient?.last_name || ''}`
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                {session.status === 'in_progress' ? formatDuration(sessionDuration) : 'Not started'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Rate: ₦{session.consultation_rate.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Interface */}
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Video Call Interface</p>
                <p className="text-sm opacity-75">
                  {session.status === 'scheduled' ? 'Waiting to start...' : 
                   session.status === 'in_progress' ? 'Session in progress' :
                   'Session ended'}
                </p>
              </div>
            </div>
            
            {/* Control Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`rounded-full ${videoEnabled ? 'text-white' : 'text-red-400'}`}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`rounded-full ${audioEnabled ? 'text-white' : 'text-red-400'}`}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                {session.status === 'scheduled' && (
                  <Button
                    onClick={startSession}
                    className="bg-green-600 hover:bg-green-700 rounded-full"
                  >
                    Start Session
                  </Button>
                )}

                {session.status === 'in_progress' && (
                  <Button
                    onClick={endSession}
                    variant="destructive"
                    className="rounded-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    End Call
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white rounded-full"
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      {session.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium">{formatDuration(session.duration_minutes || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge variant={session.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {session.payment_status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
