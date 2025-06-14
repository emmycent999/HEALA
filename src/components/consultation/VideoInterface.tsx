
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle } from 'lucide-react';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VideoInterfaceProps {
  session: ConsultationSession;
  onStartSession: () => void;
  onEndSession: () => void;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({
  session,
  onStartSession,
  onEndSession
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    incomingCall,
    callInitiator,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    answerCall,
    declineCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useVideoCall({
    sessionId: session.id,
    userId: user?.id || '',
    userRole: profile?.role === 'physician' ? 'physician' : 'patient',
    sessionStatus: session.status
  });

  // Listen for session status changes to notify the other user
  useEffect(() => {
    const channel = supabase
      .channel(`session_${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${session.id}`
        },
        (payload) => {
          const updatedSession = payload.new as ConsultationSession;
          
          // If session just started and current user didn't start it
          if (updatedSession.status === 'in_progress' && session.status === 'scheduled') {
            const otherUserRole = profile?.role === 'physician' ? 'patient' : 'physician';
            toast({
              title: "Session Started!",
              description: `The ${otherUserRole} has started the consultation.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, session.status, profile?.role, toast]);

  const handleStartCall = () => {
    const callerName = `${profile?.first_name} ${profile?.last_name}` || 'Unknown User';
    initiateCall(callerName);
  };

  const handleEndSession = () => {
    endCall();
    onEndSession();
  };

  const handleAnswerCall = () => {
    answerCall();
  };

  const handleDeclineCall = () => {
    declineCall();
  };

  const handleMessageCall = () => {
    declineCall();
    toast({
      title: "Opening Chat",
      description: "You can send a message instead of taking the call.",
    });
    // Here you could open a chat interface or redirect to messaging
  };

  return (
    <>
      {/* Incoming Call Dialog */}
      <IncomingCallDialog
        isOpen={incomingCall}
        session={session}
        callerName={callInitiator}
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
        onMessage={handleMessageCall}
      />

      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: connectionState === 'connected' ? 'block' : 'none' }}
            />
            
            {/* Local Video */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white shadow-lg"
              style={{ display: isCallActive ? 'block' : 'none' }}
            />

            {/* Placeholder when no video */}
            {!isCallActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Video Call Interface</p>
                  <p className="text-sm opacity-75">
                    {session.status === 'scheduled' ? 'Ready to start video consultation' : 
                     session.status === 'in_progress' ? 'Session is active - click "Start Video Call" to connect' :
                     'Session ended'}
                  </p>
                </div>
              </div>
            )}

            {/* Connection Status */}
            {isCallActive && connectionState !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg">
                    {connectionState === 'connecting' ? 'Connecting to video call...' :
                     connectionState === 'new' ? 'Initializing video call...' :
                     connectionState === 'failed' ? 'Connection failed' :
                     connectionState}
                  </p>
                </div>
              </div>
            )}
            
            {/* Control Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
                {isCallActive && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleVideo}
                      className={`rounded-full ${videoEnabled ? 'text-white' : 'text-red-400'}`}
                    >
                      {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleAudio}
                      className={`rounded-full ${audioEnabled ? 'text-white' : 'text-red-400'}`}
                    >
                      {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>
                  </>
                )}

                {session.status === 'scheduled' && (
                  <Button
                    onClick={onStartSession}
                    className="bg-green-600 hover:bg-green-700 rounded-full"
                  >
                    Start Session
                  </Button>
                )}

                {session.status === 'in_progress' && !isCallActive && (
                  <Button
                    onClick={handleStartCall}
                    className="bg-blue-600 hover:bg-blue-700 rounded-full"
                  >
                    Start Video Call
                  </Button>
                )}

                {session.status === 'in_progress' && isCallActive && (
                  <Button
                    onClick={handleEndSession}
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
    </>
  );
};
