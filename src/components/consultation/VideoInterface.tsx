
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useSimpleVideoCall } from './hooks/useSimpleVideoCall';
import { IncomingCallDialog } from './IncomingCallDialog';
import { VideoStreams } from './VideoStreams';
import { VideoConnectionStatus } from './VideoConnectionStatus';
import { VideoControls } from './VideoControls';
import { ConsultationActions } from './ConsultationActions';
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
  const [videoStarted, setVideoStarted] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [VideoInterface] Render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role,
    videoStarted
  });

  // Update session and auto-start video for patients
  useEffect(() => {
    setCurrentSession(session);
    
    // Auto-start video immediately when session is in progress
    if (session.status === 'in_progress' && !videoStarted) {
      console.log('🎥 [VideoInterface] Auto-starting video for active session');
      setVideoStarted(true);
      handleStartCall();
    }
  }, [session, videoStarted]);

  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useSimpleVideoCall({
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient',
    autoStart: videoStarted
  });

  const handleStartConsultation = async () => {
    try {
      console.log('👨‍⚕️ [VideoInterface] Starting consultation');
      
      const { error } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      
      setCurrentSession(prev => ({ 
        ...prev, 
        status: 'in_progress',
        started_at: new Date().toISOString()
      }));
      
      await onStartSession();
      
      toast({
        title: "🚀 Consultation Started",
        description: "Video call is starting now",
      });

      // Start video immediately
      setVideoStarted(true);
      handleStartCall();
      
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
    console.log('📞 [VideoInterface] Starting video call directly');
    startCall();
  };

  const handleEndSession = () => {
    endCall();
    setVideoStarted(false);
    onEndSession();
  };

  const renderContent = () => {
    // Show video streams when call is active
    if (isCallActive) {
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
    }

    // Show consultation actions for non-active calls
    return (
      <ConsultationActions
        sessionStatus={currentSession.status}
        isPhysician={isPhysician}
        isPatient={isPatient}
        consultationStarted={currentSession.status === 'in_progress'}
        showJoinButton={currentSession.status === 'in_progress'}
        isCallActive={isCallActive}
        autoJoinAttempted={false}
        onStartConsultation={handleStartConsultation}
        onPatientJoin={handleStartCall}
        onStartCall={handleStartCall}
        onEnableManualJoin={() => {}}
      />
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
};
