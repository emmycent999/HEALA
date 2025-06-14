
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConsultationSession {
  id: string;
  patient_id: string;
  physician_id: string;
  status: string;
  consultation_rate: number;
  session_type: string;
  started_at: string | null;
  ended_at: string | null;
}

interface VirtualConsultationRoomProps {
  sessionId?: string;
}

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
      setConsultationStarted(!!data.started_at);
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

  const startConsultation = async () => {
    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setConsultationStarted(true);
      toast({
        title: "Consultation Started",
        description: "Virtual consultation session has begun.",
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation.",
        variant: "destructive"
      });
    }
  };

  const endConsultation = async () => {
    try {
      const startTime = session?.started_at ? new Date(session.started_at) : new Date();
      const endTime = new Date();
      const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          ended_at: endTime.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Process payment
      if (session) {
        const { error: paymentError } = await supabase.rpc('process_consultation_payment', {
          session_uuid: session.id,
          patient_uuid: session.patient_id,
          physician_uuid: session.physician_id,
          amount: session.consultation_rate
        });

        if (paymentError) {
          console.error('Payment processing error:', paymentError);
          toast({
            title: "Payment Error",
            description: "Consultation ended but payment processing failed.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Consultation Completed",
            description: `Session ended. Payment of ₦${session.consultation_rate.toLocaleString()} processed.`,
          });
        }
      }

      setConsultationStarted(false);
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast({
        title: "Error",
        description: "Failed to end consultation.",
        variant: "destructive"
      });
    }
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

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-500">No consultation session found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Virtual Consultation
            </span>
            <Badge variant={consultationStarted ? "default" : "secondary"}>
              {consultationStarted ? "Active" : "Waiting"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Session Type</p>
              <p className="font-medium capitalize">{session.session_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Consultation Rate</p>
              <p className="font-medium">₦{session.consultation_rate.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Call Interface */}
      <Card>
        <CardContent className="pt-6">
          <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
            <div className="text-center text-white">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Video call interface would be here</p>
              <p className="text-sm opacity-75">Integration with WebRTC or video calling service</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              variant={isVideoOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsVideoOn(!isVideoOn)}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isAudioOn ? "default" : "destructive"}
              size="lg"
              onClick={() => setIsAudioOn(!isAudioOn)}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button variant="outline" size="lg">
              <MessageCircle className="w-5 h-5" />
            </Button>

            {consultationStarted ? (
              <Button 
                variant="destructive" 
                size="lg"
                onClick={endConsultation}
              >
                <Phone className="w-5 h-5 mr-2" />
                End Call
              </Button>
            ) : (
              <Button 
                variant="default" 
                size="lg"
                onClick={startConsultation}
                className="bg-green-600 hover:bg-green-700"
              >
                <Video className="w-5 h-5 mr-2" />
                Start Consultation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                {session.status}
              </Badge>
            </div>
            {session.started_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span>{new Date(session.started_at).toLocaleString()}</span>
              </div>
            )}
            {session.ended_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ended:</span>
                <span>{new Date(session.ended_at).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Rate:</span>
              <span className="font-medium">₦{session.consultation_rate.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
