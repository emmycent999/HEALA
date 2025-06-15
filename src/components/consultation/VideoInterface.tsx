
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useVideoCall } from './hooks/useVideoCall';
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
    videoStarted,
    sessionId: currentSession.id
  });

  // Update session when prop changes
  useEffect(() => {
    console.log('🔄 [VideoInterface] Session prop updated:', session.status);
    setCurrentSession(session);
  }, [session]);

  // Set up real-time session monitoring
  useEffect(() => {
    if (!currentSession.id) return;

    console.log('📡 [VideoInterface] Setting up real-time session monitoring');
    
    const channel = supabase
      .channel(`session_${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `id=eq.${currentSession.id}`
        },
        (payload) => {
          console.log('📨 [VideoInterface] Session update received:', payload);
          const updatedSession = payload.new as any;
          
          setCurrentSession(prev => ({
            ...prev,
            ...updatedSession
          }));

          // If patient and session just started, show notification
          if (isPatient && updatedSession.status === 'in_progress' && currentSession.status === 'scheduled') {
            console.log('🎯 [VideoInterface] Patient notified of consultation start');
            toast({
              title: "🚨 Doctor Started Consultation!",
              description: "Click 'Join Now' to enter the video call",
              duration: 8000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [VideoInterface] Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 [VideoInterface] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentSession.id, isPatient, currentSession.status]);

  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    error,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useVideoCall({
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient',
    autoStart: false // Don't auto-start, let user control
  });

  const handleStartConsultation = async () => {
    try {
      console.log('👨‍⚕️ [VideoInterface] Physician starting consultation');
      
      const { error } = await supabase
        .from('consultation_sessions')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      
      // Update local state immediately
      const updatedSession = {
        ...currentSession,
        status: 'in_progress' as const,
        started_at: new Date().toISOString()
      };
      
      setCurrentSession(updatedSession);
      
      await onStartSession();
      
      toast({
        title: "🚀 Consultation Started",
        description: "Session is now active. Start your video when ready.",
      });

      // Don't auto-start video, let physician control it
      
    } catch (error) {
      console.error('❌ [VideoInterface] Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePatientJoin = () => {
    console.log('👤 [VideoInterface] Patient joining video call');
    setVideoStarted(true);
    startCall();
    
    toast({
      title: "📞 Joining Video Call",
      description: "Connecting to the consultation...",
    });
  };

  const handleStartCall = () => {
    console.log('📞 [VideoInterface] Starting video call manually');
    setVideoStarted(true);
    startCall();
  };

  const handleEndSession = () => {
    endCall();
    setVideoStarted(false);
    onEndSession();
  };

  // Show error state if there's an error
  if (error) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-red-200 max-w-md">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-red-800 mb-2">Video Call Error</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={handleStartCall}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show video streams when call is active
  if (isCallActive) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
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

            {/* Debug info overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Role: {profile?.role}</div>
              <div>Status: {currentSession.status}</div>
              <div>Connection: {connectionState}</div>
              <div>Call Active: {isCallActive ? 'Yes' : 'No'}</div>
              <div>Video Started: {videoStarted ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show consultation actions for non-active calls
  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
          <ConsultationActions
            sessionStatus={currentSession.status}
            isPhysician={isPhysician}
            isPatient={isPatient}
            consultationStarted={currentSession.status === 'in_progress'}
            showJoinButton={currentSession.status === 'in_progress'}
            isCallActive={isCallActive}
            autoJoinAttempted={false}
            onStartConsultation={handleStartConsultation}
            onPatientJoin={handlePatientJoin}
            onStartCall={handleStartCall}
            onEnableManualJoin={() => {}}
          />

          {/* Debug info overlay for actions */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
            <div>Role: {profile?.role}</div>
            <div>Status: {currentSession.status}</div>
            <div>Show Join: {currentSession.status === 'in_progress' ? 'Yes' : 'No'}</div>
            <div>Is Patient: {isPatient ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
