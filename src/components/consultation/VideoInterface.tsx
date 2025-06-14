
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoStreams } from './VideoStreams';
import { VideoPlaceholder } from './VideoPlaceholder';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
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
            <VideoStreams
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isCallActive={isCallActive}
              connectionState={connectionState}
            />

            <VideoPlaceholder
              isCallActive={isCallActive}
              sessionStatus={session.status}
            />

            <VideoConnectionStatus
              isCallActive={isCallActive}
              connectionState={connectionState}
            />
            
            <VideoControls
              isCallActive={isCallActive}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              sessionStatus={session.status}
              onToggleVideo={toggleVideo}
              onToggleAudio={toggleAudio}
              onStartSession={onStartSession}
              onStartCall={handleStartCall}
              onEndCall={handleEndSession}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
