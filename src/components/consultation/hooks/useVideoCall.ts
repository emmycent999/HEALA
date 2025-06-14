
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
  const [incomingCall, setIncomingCall] = useState(false);
  const [callInitiator, setCallInitiator] = useState<string>('');
  
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

  // Listen for call invitations
  useEffect(() => {
    if (sessionStatus === 'in_progress') {
      setupSignaling();
    }
  }, [sessionStatus]);

  const setupSignaling = () => {
    const channelName = `consultation_${sessionId}`;
    signalingChannel.current = supabase.channel(channelName);

    signalingChannel.current
      .on('broadcast', { event: 'call-invitation' }, (payload: any) => {
        const { sender, senderName } = payload.payload;
        
        // Don't process our own messages
        if (sender === userId) return;

        console.log('Received call invitation from:', senderName);
        setCallInitiator(senderName || 'Unknown User');
        setIncomingCall(true);
      })
      .on('broadcast', { event: 'call-declined' }, (payload: any) => {
        const { sender } = payload.payload;
        
        if (sender === userId) return;

        toast({
          title: "Call Declined",
          description: "The other participant declined the call.",
          variant: "destructive"
        });
        setIsCallActive(false);
      })
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

  const initiateCall = async (callerName: string) => {
    try {
      console.log('Initiating call for user:', userId, 'role:', userRole);
      
      // Send call invitation to other user
      if (signalingChannel.current) {
        signalingChannel.current.send({
          type: 'broadcast',
          event: 'call-invitation',
          payload: { sender: userId, senderName: callerName }
        });
      }

      toast({
        title: "Calling...",
        description: "Sending call invitation to the other participant.",
      });
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error",
        description: "Failed to initiate call.",
        variant: "destructive"
      });
    }
  };

  const answerCall = async () => {
    try {
      if (!webRTCService.current) return;

      console.log('Answering call for user:', userId, 'role:', userRole);
      
      await webRTCService.current.startLocalVideo();
      setIsCallActive(true);
      setIncomingCall(false);

      // If physician, wait for offer. If patient, create offer
      if (userRole === 'patient') {
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
        title: "Call Answered",
        description: "Connecting to video call...",
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
    
    // Send decline notification
    if (signalingChannel.current) {
      signalingChannel.current.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: { sender: userId }
      });
    }

    toast({
      title: "Call Declined",
      description: "You declined the incoming call.",
    });
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
    setIncomingCall(false);
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
