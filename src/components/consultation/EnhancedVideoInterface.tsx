
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ConsultationSession } from './types';
import { useWebRTCVideoCall } from './hooks/useWebRTCVideoCall';
import { useConnectionMonitor } from './hooks/useConnectionMonitor';
import { VideoStreams } from './VideoStreams';
import { EnhancedVideoControls } from './EnhancedVideoControls';
import { ConnectionQualityIndicator } from './ConnectionQualityIndicator';
import { ConsultationActions } from './ConsultationActions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedVideoInterfaceProps {
  session: ConsultationSession;
  onStartSession: () => void;
  onEndSession: () => void;
}

export const EnhancedVideoInterface: React.FC<EnhancedVideoInterfaceProps> = ({
  session,
  onStartSession,
  onEndSession
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState(session);
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

  console.log('🖥️ [EnhancedVideoInterface] Render:', { 
    sessionStatus: currentSession.status, 
    userRole: profile?.role,
    sessionId: currentSession.id
  });

  // Update session when prop changes
  useEffect(() => {
    setCurrentSession(session);
  }, [session]);

  // Set up real-time session monitoring
  useEffect(() => {
    if (!currentSession.id) return;

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
          const updatedSession = payload.new as any;
          
          setCurrentSession(prev => ({
            ...prev,
            ...updatedSession,
            patient: prev.patient,
            physician: prev.physician
          }));

          if (isPatient && updatedSession.status === 'in_progress' && currentSession.status === 'scheduled') {
            toast({
              title: "🚨 Doctor Started Consultation!",
              description: "Click 'Join Now' to enter the video call",
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentSession.id, isPatient, currentSession.status]);

  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    isConnecting,
    localVideoRef,
    remoteVideoRef,
    peerConnectionRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio,
    reconnect
  } = useWebRTCVideoCall({
    sessionId: currentSession.id,
    userId: user?.id || '',
    userRole: isPhysician ? 'physician' : 'patient'
  });

  // Connection monitoring
  const { connectionQuality, reconnectionAttempts } = useConnectionMonitor({
    peerConnection: peerConnectionRef.current,
    isCallActive,
    onConnectionQualityChange: (quality) => {
      console.log('📊 [EnhancedVideoInterface] Connection quality:', quality);
      
      if (quality.level === 'poor') {
        toast({
          title: "⚠️ Poor Connection Quality",
          description: `Latency: ${quality.latency}ms, Packet Loss: ${quality.packetLoss}%`,
          variant: "destructive"
        });
      }
    },
    onReconnectionNeeded: async () => {
      setIsReconnecting(true);
      toast({
        title: "🔄 Reconnecting...",
        description: "Attempting to improve connection quality",
      });
      
      try {
        await reconnect();
        toast({
          title: "✅ Reconnected",
          description: "Connection quality restored",
        });
      } catch (error) {
        toast({
          title: "❌ Reconnection Failed",
          description: "Please try manually reconnecting",
          variant: "destructive"
        });
      } finally {
        setIsReconnecting(false);
      }
    }
  });

  const handleStartConsultation = async () => {
    try {
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
        status: 'in_progress' as const,
        started_at: new Date().toISOString()
      }));
      
      await onStartSession();
      
      toast({
        title: "🚀 Consultation Started",
        description: "Session is now active. Start your video when ready.",
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

  const handleJoinCall = () => {
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

  // Unified video interface for all call states
  if (isCallActive || isConnecting || isReconnecting) {
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

            {/* Connection Status Overlay */}
            {(isConnecting || isReconnecting || connectionState !== 'connected') && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white text-lg">
                    {isReconnecting ? `Reconnecting... (${reconnectionAttempts}/3)` : 
                     isConnecting ? 'Connecting...' : 
                     `Connection: ${connectionState}`}
                  </p>
                  {connectionState === 'failed' && (
                    <button 
                      onClick={reconnect}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Retry Connection
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Connection Quality Indicator */}
            <ConnectionQualityIndicator 
              quality={connectionQuality}
              className="absolute top-4 right-4"
            />

            {/* Enhanced Video Controls */}
            <EnhancedVideoControls
              isCallActive={isCallActive}
              videoEnabled={videoEnabled}
              audioEnabled={audioEnabled}
              sessionStatus={currentSession.status}
              connectionQuality={connectionQuality}
              onToggleVideo={toggleVideo}
              onToggleAudio={toggleAudio}
              onEndCall={handleEndSession}
              onReconnect={reconnect}
            />
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
        </div>
      </CardContent>
    </Card>
  );
};
