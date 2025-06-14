
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConsultationSession {
  id: string;
  patient_id: string;
  physician_id: string;
  consultation_rate: number;
  status: string;
  session_type: string;
  payment_status: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician';
  sender_id: string;
  created_at: string;
}

interface VirtualConsultationRoomProps {
  sessionId: string;
}

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<ConsultationSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      setupRealtimeSubscription();
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`consultation-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startSession = async () => {
    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      setSessionStarted(true);
      
      toast({
        title: "Session Started",
        description: "Virtual consultation session has begun.",
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endSession = async () => {
    try {
      const endTime = new Date();
      const startTime = new Date(session?.started_at || Date.now());
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

      // Process payment if not already paid
      if (session?.payment_status === 'pending') {
        await processConsultationPayment();
      }

      setSessionStarted(false);
      toast({
        title: "Session Ended",
        description: "Virtual consultation has been completed.",
      });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session properly.",
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
          description: `₦${session.consultation_rate} has been deducted from your wallet.`,
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    try {
      const messageData = {
        conversation_id: sessionId,
        content: newMessage,
        sender_type: profile?.role === 'physician' ? 'physician' : 'patient',
        sender_id: user?.id
      };

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  const toggleVideo = async () => {
    try {
      if (!isVideoOn) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
      setIsVideoOn(!isVideoOn);
    } catch (error) {
      console.error('Error toggling video:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  if (!session) {
    return <div className="p-6">Loading consultation session...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen max-h-screen">
      {/* Video Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Virtual Consultation</span>
              <Badge variant={sessionStarted ? "default" : "secondary"}>
                {sessionStarted ? "Active" : "Waiting"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-900 rounded-lg aspect-video mb-4">
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 mx-auto mb-4" />
                    <p>Camera is off</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isVideoOn ? "default" : "secondary"}
                size="lg"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant={isAudioOn ? "default" : "secondary"}
                size="lg"
                onClick={() => setIsAudioOn(!isAudioOn)}
              >
                {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              {!sessionStarted ? (
                <Button onClick={startSession} className="bg-green-600 hover:bg-green-700">
                  Start Session
                </Button>
              ) : (
                <Button onClick={endSession} variant="destructive">
                  <Phone className="w-5 h-5 mr-2" />
                  End Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Section */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
