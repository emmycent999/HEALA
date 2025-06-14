
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoStreams } from './VideoStreams';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
import { ConsultationActions } from './ConsultationActions';
import { useNotificationManager, sendConsultationStarted } from './hooks/useNotificationManager';
import { useAutoJoinManager } from './hooks/useAutoJoinManager';
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
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [VideoInterface] Render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role,
    consultationStarted
  });

  // Update local state when session prop changes
  useEffect(() => {
    console.log('📥 [VideoInterface] Session prop changed:', session);
    setCurrentSession(session);
    setConsultationStarted(session.status === 'in_progress');
  }, [session]);

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

  const {
    autoJoinAttempted,
    showJoinButton,
    triggerAutoJoin,
    triggerManualJoin,
    resetAutoJoin,
    enableManualJoin
  } = useAutoJoinManager({
    sessionId: currentSession.id,
    userId: user?.id || '',
    profile,
    isPatient,
    initiateCall,
    sendPatientJoined: async (sessionId: string, patientId: string) => {
      const { sendPatientJoined } = await import('./hooks/useNotificationManager');
      return sendPatientJoined(sessionId, patientId);
    }
  });

  // Use the centralized notification manager
  useNotificationManager({
    sessionId: currentSession.id,
    userId: user?.id || '',
    isPatient,
    isPhysician,
    onConsultationStarted: () => {
      console.log('🎉 [VideoInterface] Consultation started handler triggered');
      setConsultationStarted(true);
      setCurrentSession(prev => ({ ...prev, status: 'in_progress' }));
      
      if (isPatient) {
        console.log('🎯 [VideoInterface] Patient: Auto-joining video call');
        setTimeout(() => {
          triggerAutoJoin();
        }, 1000);
      }
    },
    onPatientJoined: () => {
      console.log('👋 [VideoInterface] Patient joined handler triggered');
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
      console.log('👨‍⚕️ [VideoInterface] Doctor starting consultation for session:', currentSession.id);
      
      // Update session status in database first
      const { error } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) {
        console.error('❌ [VideoInterface] Error updating session status:', error);
        throw error;
      }
      
      console.log('✅ [VideoInterface] Session status updated to in_progress in database');
      
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
      
      // Send real-time notifications as backup
      await sendConsultationStarted(currentSession.id, user?.id || '');
      
      toast({
        title: "🚀 Consultation Started",
        description: "Patient is being notified and will join automatically...",
      });
    } catch (error) {
      console.error('❌ [VideoInterface] Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStartCall = () => {
    const callerName = `${profile?.first_name || 'Unknown'} ${profile?.last_name || 'User'}`.trim();
    initiateCall(callerName);
  };

  const handleEndSession = () => {
    endCall();
    resetAutoJoin();
    onEndSession();
  };

  const renderContent = () => {
    console.log('🎨 [VideoInterface] Rendering content:', { 
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
          autoJoinAttempted={autoJoinAttempted}
          onStartConsultation={handleStartConsultation}
          onPatientJoin={triggerManualJoin}
          onStartCall={handleStartCall}
          onEnableManualJoin={enableManualJoin}
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
      <IncomingCallDialog
        isOpen={incomingCall}
        session={currentSession}
        callerName={callInitiator}
        onAnswer={answerCall}
        onDecline={declineCall}
        onMessage={() => {
          declineCall();
          toast({
            title: "Opening Chat",
            description: "You can send a message instead of taking the call.",
          });
        }}
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
