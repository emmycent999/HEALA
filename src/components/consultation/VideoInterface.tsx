
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
import { Video, Clock, UserCheck } from 'lucide-react';

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

  console.log('VideoInterface - Current user role:', profile?.role);
  console.log('VideoInterface - Session status:', session.status);
  console.log('VideoInterface - Session type:', session.session_type);
  console.log('VideoInterface - Is physician:', isPhysician);
  console.log('VideoInterface - Is patient:', isPatient);

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
    if (!user?.id) return;

    const channel = supabase
      .channel(`consultation_${session.id}`)
      .on('broadcast', { event: 'consultation-started' }, (payload) => {
        console.log('Received consultation-started event:', payload);
        if (payload.payload.startedBy !== user?.id) {
          setConsultationStarted(true);
          if (isPatient) {
            setShowJoinButton(true);
            toast({
              title: "🚨 Consultation Started!",
              description: "The doctor has started the consultation. Click 'Join Now' to connect.",
            });
          }
        }
      })
      .on('broadcast', { event: 'patient-joined' }, (payload) => {
        console.log('Received patient-joined event:', payload);
        if (payload.payload.patientId !== user?.id && isPhysician) {
          toast({
            title: "Patient Joined",
            description: "The patient has joined the consultation.",
          });
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up channel subscription');
      supabase.removeChannel(channel);
    };
  }, [session.id, user?.id, isPatient, isPhysician, toast]);

  // Check if consultation was already started
  useEffect(() => {
    console.log('Checking session status on mount:', session.status);
    if (session.status === 'in_progress') {
      setConsultationStarted(true);
      if (isPatient) {
        setShowJoinButton(true);
      }
    }
  }, [session.status, isPatient]);

  const handleStartConsultation = async () => {
    try {
      console.log('Doctor starting consultation...');
      
      // Start the session in database
      await onStartSession();
      
      // Create a dedicated channel for this notification
      const notificationChannel = supabase.channel(`consultation_notification_${session.id}_${Date.now()}`);
      
      // Send notification to patient
      await notificationChannel.send({
        type: 'broadcast',
        event: 'consultation-started',
        payload: { 
          startedBy: user?.id, 
          sessionId: session.id,
          timestamp: new Date().toISOString()
        }
      });
      
      // Also send on the main channel
      const mainChannel = supabase.channel(`consultation_${session.id}`);
      await mainChannel.send({
        type: 'broadcast',
        event: 'consultation-started',
        payload: { 
          startedBy: user?.id, 
          sessionId: session.id,
          timestamp: new Date().toISOString()
        }
      });
      
      setConsultationStarted(true);
      
      toast({
        title: "Consultation Started",
        description: "Patient has been notified. Waiting for them to join...",
      });

      console.log('Consultation start notification sent');
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
    console.log('Rendering content - Session status:', session.status, 'User role:', profile?.role);
    
    // Session not started yet
    if (session.status === 'scheduled') {
      if (isPhysician) {
        console.log('Rendering: Physician - session not started');
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-blue-200 max-w-md">
              <Video className="w-20 h-20 mx-auto mb-6 text-blue-500" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Video Consultation</h3>
              <p className="text-gray-600 mb-6">
                Click "Start Consultation" to begin the video session and notify the patient.
              </p>
              <Button
                onClick={handleStartConsultation}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                size="lg"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Start Video Consultation
              </Button>
              <div className="mt-4 text-sm text-gray-500">
                Patient will be notified when you start
              </div>
            </div>
          </div>
        );
      } else {
        console.log('Rendering: Patient - waiting for doctor');
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-gray-200 max-w-md">
              <Clock className="w-20 h-20 mx-auto mb-6 text-gray-400 animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Waiting for Doctor</h3>
              <p className="text-gray-600 mb-4">
                The video consultation has not started yet. You will be notified when the doctor begins the session.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  📱 Make sure notifications are enabled so you don't miss when the doctor starts the consultation.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mr-2"></div>
                Waiting for doctor to start...
              </div>
            </div>
          </div>
        );
      }
    }

    // Session started - patient needs to join
    if (session.status === 'in_progress' && isPatient && showJoinButton && !isCallActive) {
      console.log('Rendering: Patient - join now button');
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 animate-pulse max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-green-500 animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🚨 Video Consultation Started!</h3>
            <p className="text-gray-600 mb-6">
              The doctor has started the video consultation. Click below to join the video call now.
            </p>
            <Button
              onClick={handlePatientJoin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg animate-pulse"
              size="lg"
            >
              <Video className="w-5 h-5 mr-2" />
              Join Video Call Now
            </Button>
            <div className="mt-4 text-sm text-green-600 font-medium">
              Doctor is waiting for you!
            </div>
          </div>
        </div>
      );
    }

    // Session started - physician waiting or call active
    if (session.status === 'in_progress') {
      console.log('Rendering: In progress - call active:', isCallActive);
      return (
        <>
          <VideoStreams
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isCallActive={isCallActive}
            connectionState={connectionState}
          />

          {!isCallActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-purple-200 max-w-md">
                <Video className="w-20 h-20 mx-auto mb-6 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {isPhysician ? 'Waiting for patient to join video call...' : 'Preparing video call...'}
                </h3>
                {isPhysician && (
                  <>
                    <p className="text-gray-600 mb-6">
                      The patient will join automatically. You can also start the video call manually if needed.
                    </p>
                    <Button
                      onClick={handleStartCall}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Start Video Call
                    </Button>
                  </>
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
    console.log('Rendering: Default fallback');
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
          <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden min-h-[400px]">
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </>
  );
};
