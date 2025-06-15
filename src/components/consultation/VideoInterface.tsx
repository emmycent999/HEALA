
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
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
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [VideoInterface] Render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role,
    sessionId: currentSession.id,
    sessionType: currentSession.session_type
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
            ...updatedSession,
            // Keep the profile data from the previous state
            patient: prev.patient,
            physician: prev.physician
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
    isConnecting,
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTCVideoCall({
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient'
  });

  const handleStartConsultation = async () => {
    try {
      console.log('👨‍⚕️ [VideoInterface] Physician starting consultation');
      
      // Update session to in_progress and ensure it's video type
      const updateData: any = {
        status: 'in_progress',
        started_at: new Date().toISOString()
      };

      // Convert chat sessions to video when physician starts video
      if (currentSession.session_type === 'chat') {
        updateData.session_type = 'video';
        console.log('🔄 [VideoInterface] Converting chat session to video');
      }

      const { error } = await supabase
        .from('consultation_sessions')
        .update(updateData)
        .eq('id', currentSession.id);

      if (error) throw error;
      
      // Update local state immediately
      const updatedSession = {
        ...currentSession,
        status: 'in_progress' as const,
        session_type: 'video' as const,
        started_at: new Date().toISOString()
      };
      
      setCurrentSession(updatedSession);
      
      await onStartSession();
      
      toast({
        title: "🚀 Consultation Started",
        description: "Session is now active. Start your video when ready.",
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

  const handleJoinCall = () => {
    console.log('👤 [VideoInterface] User joining video call');
    startCall();
    
    toast({
      title: "📞 Joining Video Call",
      description: "Connecting to the consultation...",
    });
  };

  const handleEndSession = () => {
    endCall();
    onEndSession();
  };

  // Show video interface when call is active
  if (isCallActive || isConnecting) {
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
              isConnecting={isConnecting}
            />
            
            <VideoControls
              isCallActive={isCallActive}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              sessionStatus={currentSession.status}
              onToggleVideo={toggleVideo}
              onToggleAudio={toggleAudio}
              onStartSession={onStartSession}
              onStartCall={handleJoinCall}
              onEndCall={handleEndSession}
            />

            {/* Debug info overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
              <div>Role: {profile?.role}</div>
              <div>Status: {currentSession.status}</div>
              <div>Type: {currentSession.session_type}</div>
              <div>Connection: {connectionState}</div>
              <div>Call Active: {isCallActive ? 'Yes' : 'No'}</div>
              <div>Connecting: {isConnecting ? 'Yes' : 'No'}</div>
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
            onPatientJoin={handleJoinCall}
            onStartCall={handleJoinCall}
            onEnableManualJoin={() => {}}
          />

          {/* Debug info overlay for actions */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
            <div>Role: {profile?.role}</div>
            <div>Status: {currentSession.status}</div>
            <div>Type: {currentSession.session_type}</div>
            <div>Show Join: {currentSession.status === 'in_progress' ? 'Yes' : 'No'}</div>
            <div>Is Patient: {isPatient ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
