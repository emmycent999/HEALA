
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Video } from 'lucide-react';

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
  const [consultationStarted, setConsultationStarted] = useState(false);
  const [showJoinButton, setShowJoinButton] = useState(false);
  
  const isPhysician = profile?.role === 'physician';
  const isPatient = profile?.role === 'patient';

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

  // Listen for consultation start notifications
  useEffect(() => {
    const channel = supabase
      .channel(`consultation_${session.id}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        if (payload.payload.startedBy !== user?.id) {
          setConsultationStarted(true);
          if (isPatient) {
            setShowJoinButton(true);
            toast({
              title: "Consultation Started!",
              description: "The doctor has started the consultation. Click 'Join Now' to connect.",
            });
          }
        }
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        if (payload.payload.patientId !== user?.id && isPhysician) {
          toast({
            title: "Patient Joined",
            description: "The patient has joined the consultation.",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, user?.id, isPatient, isPhysician, toast]);

  // Check if consultation was already started
  useEffect(() => {
    if (session.status === 'in_progress') {
      setConsultationStarted(true);
      if (isPatient) {
        setShowJoinButton(true);
      }
    }
  }, [session.status, isPatient]);

  const handleStartConsultation = async () => {
    try {
      // Start the session in database
      await onStartSession();
      
      // Notify patient via realtime
      const channel = supabase.channel(`consultation_${session.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'consultation-started',
        payload: { startedBy: user?.id, sessionId: session.id }
      });
      
      setConsultationStarted(true);
      
      toast({
        title: "Consultation Started",
        description: "Waiting for patient to join...",
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
      // Notify physician that patient joined
      const channel = supabase.channel(`consultation_${session.id}`);
      await channel.send({
        type: 'broadcast',
        event: 'patient-joined',
        payload: { patientId: user?.id, sessionId: session.id }
      });
      
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
    // Session not started yet
    if (session.status === 'scheduled') {
      if (isPhysician) {
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold mb-4">Ready to Start Consultation</h3>
              <p className="text-sm opacity-75 mb-6">
                Click "Start Consultation" to begin the session and notify the patient.
              </p>
              <Button
                onClick={handleStartConsultation}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Consultation
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="w-16 h-16 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold mb-4">Waiting for Doctor</h3>
              <p className="text-sm opacity-75">
                The consultation has not started yet. Please wait for the doctor to begin.
              </p>
            </div>
          </div>
        );
      }
    }

    // Session started - patient needs to join
    if (session.status === 'in_progress' && isPatient && showJoinButton && !isCallActive) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <Video className="w-16 h-16 mx-auto mb-6 text-green-400" />
            <h3 className="text-xl font-semibold mb-4">Consultation Started!</h3>
            <p className="text-sm opacity-75 mb-6">
              The doctor has started the consultation. Click below to join the video call.
            </p>
            <Button
              onClick={handlePatientJoin}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Join Now
            </Button>
          </div>
        </div>
      );
    }

    // Session started - physician waiting or call active
    if (session.status === 'in_progress') {
      return (
        <>
          <VideoStreams
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isCallActive={isCallActive}
            connectionState={connectionState}
          />

          {!isCallActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <Video className="w-16 h-16 mx-auto mb-6 opacity-50" />
                <p className="text-lg mb-4">
                  {isPhysician ? 'Waiting for patient to join...' : 'Preparing video call...'}
                </p>
                {isPhysician && (
                  <Button
                    onClick={handleStartCall}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start Video Call
                  </Button>
                )}
              </div>
            </div>
          )}

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
    }

    // Default fallback
    return (
      <VideoPlaceholder
        isCallActive={isCallActive}
        sessionStatus={session.status}
      />
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
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
