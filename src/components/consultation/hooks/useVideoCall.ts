
import { useEffect, useRef } from 'react';
import { UseVideoCallProps } from './types/videoCall';
import { SignalingService } from './services/signalingService';
import { useCallState } from './services/callStateManager';
import { useWebRTCManager } from './services/webRTCManager';
import { useToast } from '@/hooks/use-toast';

export const useVideoCall = ({ sessionId, userId, userRole, sessionStatus }: UseVideoCallProps) => {
  const { toast } = useToast();
  const signalingService = useRef<SignalingService | null>(null);
  const initializationRef = useRef(false);
  
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

  // Simplified setup - only when session is ready and not already initialized
  useEffect(() => {
    if (sessionStatus === 'in_progress' && !initializationRef.current) {
      console.log('🚀 [useVideoCall] Setting up simplified signaling');
      initializationRef.current = true;
      setupSignaling();
    }
    
    return () => {
      if (signalingService.current) {
        signalingService.current.dispose();
        signalingService.current = null;
      }
    };
  }, [sessionStatus]);

  const setupSignaling = () => {
    try {
      signalingService.current = new SignalingService(sessionId, userId);
      
      signalingService.current.setupChannel({
        onCallInvitation: (sender: string, senderName: string) => {
          console.log('📞 [useVideoCall] Received call invitation from:', senderName);
          setCallInitiator(senderName || 'Unknown User');
          setIncomingCall(true);
        },
        onCallDeclined: (sender: string) => {
          console.log('📞 [useVideoCall] Call declined by:', sender);
          toast({
            title: "Call Declined",
            description: "The other participant declined the call.",
            variant: "destructive"
          });
          setIsCallActive(false);
        },
        onWebRTCSignal: async (type: string, data: any, sender: string) => {
          try {
            console.log('📡 [useVideoCall] Received WebRTC signal:', type, 'from:', sender);
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
            console.error('❌ [useVideoCall] Error handling WebRTC signal:', error);
          }
        }
      });

      setSignalingChannel({
        send: (message: string) => {
          const data = JSON.parse(message);
          signalingService.current?.sendWebRTCSignal(data.type, data.data || data.candidate);
        }
      });
    } catch (error) {
      console.error('❌ [useVideoCall] Error setting up signaling:', error);
    }
  };

  const initiateCall = async (callerName: string) => {
    try {
      console.log('📞 [useVideoCall] Initiating call - starting video immediately');
      
      // Start local video first
      await startLocalVideo();
      setIsCallActive(true);
      
      // Send call invitation
      if (signalingService.current) {
        signalingService.current.sendCallInvitation(callerName);
      }

      // Auto-answer for simplicity - create offer/answer based on role
      setTimeout(async () => {
        try {
          if (userRole === 'patient') {
            console.log('📞 [useVideoCall] Patient creating offer');
            const offer = await createOffer();
            signalingService.current?.sendWebRTCSignal('offer', offer);
          }
        } catch (error) {
          console.error('❌ [useVideoCall] Error in auto-offer:', error);
        }
      }, 1000);

      toast({
        title: "🎥 Video Call Started",
        description: "Connecting to the other participant...",
      });
    } catch (error) {
      console.error('❌ [useVideoCall] Error initiating call:', error);
      toast({
        title: "Error",
        description: "Failed to start video. Please check camera/microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const answerCall = async () => {
    try {
      console.log('📞 [useVideoCall] Answering call');
      
      await startLocalVideo();
      setIsCallActive(true);
      setIncomingCall(false);

      // Create offer/answer based on role
      if (userRole === 'patient') {
        setTimeout(async () => {
          const offer = await createOffer();
          signalingService.current?.sendWebRTCSignal('offer', offer);
        }, 500);
      }

      toast({
        title: "📞 Call Connected",
        description: "You are now in the video call.",
      });
    } catch (error) {
      console.error('❌ [useVideoCall] Error answering call:', error);
      toast({
        title: "Error",
        description: "Failed to answer call. Please check permissions.",
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
    console.log('📞 [useVideoCall] Ending call');
    webRTCEndCall();
    if (signalingService.current) {
      signalingService.current.dispose();
      signalingService.current = null;
    }
    resetCallState();
    initializationRef.current = false;
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
