import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoStreams } from './VideoStreams';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
import { ConsultationActions } from './ConsultationActions';
import { useConsultationHandlers, sendConsultationStarted, sendPatientJoined } from './ConsultationHandlers';
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
  const [currentSession, setCurrentSession] = useState(session);
  const [consultationStarted, setConsultationStarted] = useState(session.status === 'in_progress');
  const [showJoinButton, setShowJoinButton] = useState(false);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ VideoInterface render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role, 
    consultationStarted,
    autoJoinAttempted 
  });

  // Update local state when session prop changes
  useEffect(() => {
    console.log('📥 Session prop changed:', session);
    setCurrentSession(session);
    setConsultationStarted(session.status === 'in_progress');
    
    // For patients, show join button if session is in progress and auto-join hasn't been attempted
    if (isPatient && session.status === 'in_progress' && !autoJoinAttempted) {
      console.log('🎯 Patient detected session in progress, preparing auto-join');
      setShowJoinButton(true);
    }
  }, [session, isPatient, autoJoinAttempted]);

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
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient',
    sessionStatus: currentSession.status
  });

  const handlePatientAutoJoin = async () => {
    if (autoJoinAttempted) {
      console.log('⚠️ Auto-join already attempted, skipping');
      return;
    }

    try {
      console.log('🚀 Patient auto-joining consultation for session:', currentSession.id);
      setAutoJoinAttempted(true);
      
      // Notify physician that patient joined
      await sendPatientJoined(currentSession.id, user?.id || '');
      
      setShowJoinButton(false);
      
      // Start the video call automatically
      const callerName = `${profile?.first_name} ${profile?.last_name}` || 'Patient';
      setTimeout(() => {
        initiateCall(callerName);
      }, 1000);
      
      toast({
        title: "🎥 Joining Video Call",
        description: "Connecting to the consultation...",
      });
    } catch (error) {
      console.error('❌ Error auto-joining consultation:', error);
      setAutoJoinAttempted(false); // Reset on error
      toast({
        title: "Error",
        description: "Failed to join consultation automatically. Please try joining manually.",
        variant: "destructive"
      });
    }
  };

  // Use consultation handlers for real-time updates
  useConsultationHandlers({
    sessionId: currentSession.id,
    userId: user?.id || '',
    isPatient,
    isPhysician,
    onConsultationStarted: () => {
      console.log('🎉 Consultation started handler triggered');
      setConsultationStarted(true);
      
      // Update session status locally
      setCurrentSession(prev => ({ ...prev, status: 'in_progress' }));
      
      if (isPatient && !autoJoinAttempted) {
        console.log('🎯 Patient: Auto-joining video call immediately');
        setShowJoinButton(false);
        
        // Auto-join the video call after a short delay
        setTimeout(() => {
          handlePatientAutoJoin();
        }, 1500);
      }
    },
    onPatientJoined: () => {
      console.log('👋 Patient joined handler triggered');
      if (isPhysician) {
        toast({
          title: "Patient Joined",
          description: "The patient has joined the consultation.",
        });
      }
    }
  });

  const handleStartConsultation = async () => {
    try {
      console.log('👨‍⚕️ Doctor starting consultation for session:', currentSession.id);
      
      // Update session status in database first
      const { error } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('❌ Error updating session status:', error);
        throw error;
      }
      
      console.log('✅ Session status updated to in_progress in database');
      
      // Update local state immediately
      const updatedSession = { 
        ...currentSession, 
        status: 'in_progress' as const,
        started_at: new Date().toISOString()
      };
      setCurrentSession(updatedSession);
      setConsultationStarted(true);
      
      // Call the parent component's start session handler
      await onStartSession();
      
      // Send real-time notifications
      await sendConsultationStarted(currentSession.id, user?.id || '');
      
      toast({
        title: "🚀 Consultation Started",
        description: "Patient is being notified and will join automatically...",
      });
    } catch (error) {
      console.error('❌ Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePatientJoin = async () => {
    try {
      console.log('👤 Patient manually joining consultation for session:', currentSession.id);
      
      // Notify physician that patient joined
      await sendPatientJoined(currentSession.id, user?.id || '');
      
      setShowJoinButton(false);
      setAutoJoinAttempted(true);
      
      // Start the video call
      const callerName = `${profile?.first_name} ${profile?.last_name}` || 'Patient';
      initiateCall(callerName);
      
      toast({
        title: "🎥 Joining Consultation",
        description: "Connecting to video call...",
      });
    } catch (error) {
      console.error('❌ Error joining consultation:', error);
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
    console.log('🎨 Rendering content:', { 
      sessionStatus: currentSession.status, 
      userRole: profile?.role, 
      callActive: isCallActive 
    });
    
    // Show consultation actions for non-active calls
    if (!isCallActive) {
      return (
        <ConsultationActions
          sessionStatus={currentSession.status}
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
          sessionStatus={currentSession.status}
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
        session={currentSession}
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
