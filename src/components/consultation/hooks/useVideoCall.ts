
import { useState, useEffect, useRef } from 'react';
import { WebRTCService } from '../services/webRTCService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'patient' | 'physician';
  sessionStatus: string;
}

export const useVideoCall = ({ sessionId, userId, userRole, sessionStatus }: UseVideoCallProps) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webRTCService = useRef<WebRTCService | null>(null);
  const signalingChannel = useRef<any>(null);

  useEffect(() => {
    webRTCService.current = new WebRTCService();
    
    webRTCService.current.onLocalStream((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    webRTCService.current.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    webRTCService.current.onConnectionStateChange((state) => {
      setConnectionState(state);
      if (state === 'connected') {
        toast({
          title: "Connected",
          description: "Video call established successfully.",
        });
      } else if (state === 'disconnected' || state === 'failed') {
        toast({
          title: "Connection Lost",
          description: "Video call connection was lost.",
          variant: "destructive"
        });
      }
    });

    return () => {
      if (webRTCService.current) {
        webRTCService.current.dispose();
      }
      if (signalingChannel.current) {
        supabase.removeChannel(signalingChannel.current);
      }
    };
  }, [toast]);

  // Auto-connect when session status changes to 'in_progress'
  useEffect(() => {
    if (sessionStatus === 'in_progress' && !isCallActive) {
      console.log('Session is in progress, checking if should auto-connect...');
      // Auto-connect with a slight delay to ensure both users are ready
      const timeout = setTimeout(() => {
        startCall();
      }, 2000);
      
      return () => clearTimeout(timeout);
    } else if (sessionStatus !== 'in_progress' && isCallActive) {
      console.log('Session ended, disconnecting video call...');
      endCall();
    }
  }, [sessionStatus, isCallActive]);

  const setupSignaling = () => {
    const channelName = `consultation_${sessionId}`;
    signalingChannel.current = supabase.channel(channelName);

    signalingChannel.current
      .on('broadcast', { event: 'webrtc-signal' }, async (payload: any) => {
        const { type, data, sender } = payload.payload;
        
        // Don't process our own messages
        if (sender === userId) return;

        try {
          switch (type) {
            case 'offer':
              if (userRole === 'physician') {
                const answer = await webRTCService.current!.createAnswer(data);
                signalingChannel.current.send({
                  type: 'broadcast',
                  event: 'webrtc-signal',
                  payload: { type: 'answer', data: answer, sender: userId }
                });
              }
              break;
            case 'answer':
              if (userRole === 'patient') {
                await webRTCService.current!.handleAnswer(data);
              }
              break;
            case 'ice-candidate':
              await webRTCService.current!.handleIceCandidate(data);
              break;
          }
        } catch (error) {
          console.error('Error handling WebRTC signal:', error);
        }
      })
      .subscribe();

    if (webRTCService.current) {
      webRTCService.current.setSignalingChannel({
        send: (message: string) => {
          const data = JSON.parse(message);
          signalingChannel.current.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { ...data, sender: userId }
          });
        }
      });
    }
  };

  const startCall = async () => {
    try {
      if (!webRTCService.current || isCallActive) return;

      console.log('Starting video call for user:', userId, 'role:', userRole);
      
      await webRTCService.current.startLocalVideo();
      setupSignaling();
      setIsCallActive(true);

      // Patient initiates the call by creating an offer
      if (userRole === 'patient') {
        // Small delay to ensure signaling is set up
        setTimeout(async () => {
          const offer = await webRTCService.current!.createOffer();
          signalingChannel.current.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { type: 'offer', data: offer, sender: userId }
          });
        }, 1000);
      }

      toast({
        title: "Video Call Started",
        description: "Connecting to the other participant...",
      });
    } catch (error) {
      console.error('Error starting video call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const joinCall = async () => {
    // Join an existing call - same as starting but with different messaging
    try {
      if (!webRTCService.current || isCallActive) return;

      console.log('Joining video call for user:', userId, 'role:', userRole);
      
      await webRTCService.current.startLocalVideo();
      setupSignaling();
      setIsCallActive(true);

      // Physician joins by being ready to receive offer
      toast({
        title: "Joining Call",
        description: "Connecting to the consultation...",
      });
    } catch (error) {
      console.error('Error joining video call:', error);
      toast({
        title: "Error",
        description: "Failed to join video call. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    if (webRTCService.current) {
      webRTCService.current.endCall();
    }
    if (signalingChannel.current) {
      supabase.removeChannel(signalingChannel.current);
      signalingChannel.current = null;
    }
    setIsCallActive(false);
    setConnectionState('new');
  };

  const toggleVideo = () => {
    if (webRTCService.current) {
      const newVideoState = !videoEnabled;
      webRTCService.current.toggleVideo(newVideoState);
      setVideoEnabled(newVideoState);
    }
  };

  const toggleAudio = () => {
    if (webRTCService.current) {
      const newAudioState = !audioEnabled;
      webRTCService.current.toggleAudio(newAudioState);
      setAudioEnabled(newAudioState);
    }
  };

  return {
    isCallActive,
    connectionState,
    videoEnabled,
    audioEnabled,
    localVideoRef,
    remoteVideoRef,
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio
  };
};
