
import { useEffect, useRef } from 'react';
import { UseVideoCallProps } from './types/videoCall';
import { SignalingService } from './services/signalingService';
import { useCallState } from './services/callStateManager';
import { useWebRTCManager } from './services/webRTCManager';
import { useToast } from '@/hooks/use-toast';

export const useVideoCall = ({ sessionId, userId, userRole, sessionStatus }: UseVideoCallProps) => {
  const { toast } = useToast();
  const signalingService = useRef<SignalingService | null>(null);
  
  const {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    incomingCall,
    callInitiator,
    setIsCallActive,
    setConnectionState,
    setVideoEnabled,
    setAudioEnabled,
    setIncomingCall,
    setCallInitiator,
    resetCallState
  } = useCallState();

  const {
    localVideoRef,
    remoteVideoRef,
    toggleVideo: webRTCToggleVideo,
    toggleAudio: webRTCToggleAudio,
    startLocalVideo,
    createOffer,
    createAnswer,
    handleAnswer,
    handleIceCandidate,
    setSignalingChannel,
    endCall: webRTCEndCall
  } = useWebRTCManager(setConnectionState);

  // Setup signaling when session is in progress and both participants are ready
  useEffect(() => {
    if (sessionStatus === 'in_progress') {
      setupSignaling();
    }
    return () => {
      if (signalingService.current) {
        signalingService.current.dispose();
      }
    };
  }, [sessionStatus]);

  const setupSignaling = () => {
    signalingService.current = new SignalingService(sessionId, userId);
    
    signalingService.current.setupChannel({
      onCallInvitation: (sender: string, senderName: string) => {
        console.log('Received call invitation from:', senderName);
        setCallInitiator(senderName || 'Unknown User');
        setIncomingCall(true);
      },
      onCallDeclined: (sender: string) => {
        toast({
          title: "Call Declined",
          description: "The other participant declined the call.",
          variant: "destructive"
        });
        setIsCallActive(false);
      },
      onWebRTCSignal: async (type: string, data: any, sender: string) => {
        try {
          switch (type) {
            case 'offer':
              if (userRole === 'physician') {
                const answer = await createAnswer(data);
                signalingService.current?.sendWebRTCSignal('answer', answer);
              }
              break;
            case 'answer':
              if (userRole === 'patient') {
                await handleAnswer(data);
              }
              break;
            case 'ice-candidate':
              await handleIceCandidate(data);
              break;
          }
        } catch (error) {
          console.error('Error handling WebRTC signal:', error);
        }
      }
    });

    setSignalingChannel({
      send: (message: string) => {
        const data = JSON.parse(message);
        signalingService.current?.sendWebRTCSignal(data.type, data.data || data.candidate);
      }
    });
  };

  const initiateCall = async (callerName: string) => {
    try {
      console.log('Initiating call for user:', userId, 'role:', userRole);
      
      // Start local video first
      await startLocalVideo();
      
      // Send call invitation
      signalingService.current?.sendCallInvitation(callerName);

      toast({
        title: "Calling...",
        description: "Sending call invitation to the other participant.",
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error",
        description: "Failed to initiate call. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const answerCall = async () => {
    try {
      console.log('Answering call for user:', userId, 'role:', userRole);
      
      await startLocalVideo();
      setIsCallActive(true);
      setIncomingCall(false);

      // Create offer/answer based on role
      if (userRole === 'patient') {
        setTimeout(async () => {
          const offer = await createOffer();
          signalingService.current?.sendWebRTCSignal('offer', offer);
        }, 1000);
      }

      toast({
        title: "Call Connected",
        description: "You are now connected to the video call.",
      });
    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: "Error",
        description: "Failed to answer call. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const declineCall = () => {
    setIncomingCall(false);
    signalingService.current?.sendCallDeclined();
    
    toast({
      title: "Call Declined",
      description: "You declined the incoming call.",
    });
  };

  const endCall = () => {
    webRTCEndCall();
    signalingService.current?.dispose();
    signalingService.current = null;
    resetCallState();
  };

  const toggleVideo = () => {
    const newVideoState = !videoEnabled;
    webRTCToggleVideo(newVideoState);
    setVideoEnabled(newVideoState);
  };

  const toggleAudio = () => {
    const newAudioState = !audioEnabled;
    webRTCToggleAudio(newAudioState);
    setAudioEnabled(newAudioState);
  };

  return {
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
  };
};
