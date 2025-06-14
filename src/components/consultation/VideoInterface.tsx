
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoStreams } from './VideoStreams';
import { VideoPlaceholder } from './VideoPlaceholder';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
import { ConsultationActions } from './ConsultationActions';
import { useConsultationHandlers, sendConsultationStarted, sendPatientJoined } from './ConsultationHandlers';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  const [consultationStarted, setConsultationStarted] = useState(session.status === 'in_progress');
  const [showJoinButton, setShowJoinButton] = useState(session.status === 'in_progress');
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('VideoInterface - Current user role:', profile?.role);
  console.log('VideoInterface - Session status:', session.status);
  console.log('VideoInterface - Session type:', session.session_type);

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
    userRole: isPhysician ? 'physician' : 'patient',
    sessionStatus: session.status
  });

  // Use consultation handlers
  useConsultationHandlers({
    sessionId: session.id,
    userId: user?.id || '',
    isPatient,
    isPhysician,
    onConsultationStarted: () => {
      setConsultationStarted(true);
      if (isPatient) {
        setShowJoinButton(true);
      }
    },
    onPatientJoined: () => {
      // Handle patient joined logic if needed
    }
  });

  const handleStartConsultation = async () => {
    try {
      console.log('Doctor starting consultation...');
      
      // Start the session in database
      await onStartSession();
      
      // Send real-time notifications
      await sendConsultationStarted(session.id, user?.id || '');
      
      setConsultationStarted(true);
      
      toast({
        title: "Consultation Started",
        description: "Patient has been notified. Waiting for them to join...",
      });
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePatientJoin = async () => {
    try {
      console.log('Patient joining consultation...');
      
      // Notify physician that patient joined
      await sendPatientJoined(session.id, user?.id || '');
      
      setShowJoinButton(false);
      
      // Start the video call
      const callerName = `${profile?.first_name} ${profile?.last_name}` || 'Patient';
      initiateCall(callerName);
      
      toast({
        title: "Joining Consultation",
        description: "Connecting to video call...",
      });
    } catch (error) {
      console.error('Error joining consultation:', error);
      toast({
        title: "Error",
        description: "Failed to join consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

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
  };

  const renderContent = () => {
    console.log('Rendering content - Session status:', session.status, 'User role:', profile?.role);
    
    // Show consultation actions for non-active calls
    if (!isCallActive) {
      return (
        <ConsultationActions
          sessionStatus={session.status}
          isPhysician={isPhysician}
          isPatient={isPatient}
          consultationStarted={consultationStarted}
          showJoinButton={showJoinButton}
          isCallActive={isCallActive}
          onStartConsultation={handleStartConsultation}
          onPatientJoin={handlePatientJoin}
          onStartCall={handleStartCall}
        />
      );
    }

    // Show video streams when call is active
    return (
      <>
        <VideoStreams
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isCallActive={isCallActive}
          connectionState={connectionState}
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
      </>
    );
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
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
