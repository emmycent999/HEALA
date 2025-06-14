
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
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
  const [consultationStarted, setConsultationStarted] = useState(session.status === 'in_progress');
  const [videoStarted, setVideoStarted] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [VideoInterface] Render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role,
    consultationStarted,
    videoStarted
  });

  // Update local state when session prop changes
  useEffect(() => {
    console.log('📥 [VideoInterface] Session prop changed:', session);
    setCurrentSession(session);
    const wasStarted = session.status === 'in_progress';
    setConsultationStarted(wasStarted);
    
    // Auto-start video for patients when consultation becomes active
    if (wasStarted && isPatient && !videoStarted) {
      console.log('🎥 [VideoInterface] Auto-starting video for patient');
      setTimeout(() => {
        handleStartCall();
      }, 1000);
    }
  }, [session, isPatient, videoStarted]);

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

  // Simple notification handler - just listen for database changes
  useEffect(() => {
    if (currentSession.status !== 'in_progress') return;

    console.log('🔔 [VideoInterface] Setting up simple notification listener');
    
    const channel = supabase
      .channel(`consultation_simple_${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${currentSession.id}`
        },
        (payload) => {
          console.log('📡 [VideoInterface] Session update:', payload);
          const newSession = payload.new as any;
          
          if (newSession?.status === 'in_progress' && !consultationStarted) {
            console.log('🚀 [VideoInterface] Consultation started via update');
            setConsultationStarted(true);
            setCurrentSession(prev => ({ ...prev, status: 'in_progress' }));
            
            if (isPatient && !videoStarted) {
              toast({
                title: "🎥 Doctor Started Consultation!",
                description: "Starting video call...",
              });
              setTimeout(() => handleStartCall(), 500);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession.id, currentSession.status, consultationStarted, isPatient, videoStarted]);

  const handleStartConsultation = async () => {
    try {
      console.log('👨‍⚕️ [VideoInterface] Doctor starting consultation');
      
      const { error } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      
      const updatedSession = { 
        ...currentSession, 
        status: 'in_progress' as const,
        started_at: new Date().toISOString()
      };
      setCurrentSession(updatedSession);
      setConsultationStarted(true);
      
      await onStartSession();
      
      toast({
        title: "🚀 Consultation Started",
        description: "Video call is ready to begin",
      });

      // Auto-start video for physician
      setTimeout(() => handleStartCall(), 1000);
      
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
    setVideoStarted(true);
    const callerName = `${profile?.first_name || 'User'} ${profile?.last_name || ''}`.trim();
    initiateCall(callerName);
  };

  const handleEndSession = () => {
    endCall();
    setVideoStarted(false);
    onEndSession();
  };

  const renderContent = () => {
    console.log('🎨 [VideoInterface] Rendering content:', { 
      sessionStatus: currentSession.status, 
      userRole: profile?.role, 
      callActive: isCallActive,
      videoStarted
    });
    
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
        consultationStarted={consultationStarted}
        showJoinButton={consultationStarted && !videoStarted}
        isCallActive={isCallActive}
        autoJoinAttempted={false}
        onStartConsultation={handleStartConsultation}
        onPatientJoin={handleStartCall}
        onStartCall={handleStartCall}
        onEnableManualJoin={() => {}} // Not needed in simplified version
      />
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
