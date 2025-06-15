
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebRTCVideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'patient' | 'physician';
}

export const useWebRTCVideoCall = ({ sessionId, userId, userRole }: WebRTCVideoCallProps) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  console.log(`🎥 [WebRTCVideoCall] Hook initialized for ${userRole} in session ${sessionId}`);

  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Setup signaling channel
  useEffect(() => {
    if (!sessionId || !userId) return;

    console.log('📡 [WebRTCVideoCall] Setting up signaling channel');
    const channelName = `webrtc_${sessionId}`;
    
    channelRef.current = supabase.channel(channelName);

    channelRef.current
      .on('broadcast', { event: 'offer' }, handleOffer)
      .on('broadcast', { event: 'answer' }, handleAnswer)
      .on('broadcast', { event: 'ice-candidate' }, handleIceCandidate)
      .on('broadcast', { event: 'end-call' }, handleEndCall)
      .subscribe((status) => {
        console.log('📡 [WebRTCVideoCall] Channel subscription status:', status);
      });

    return () => {
      console.log('🧹 [WebRTCVideoCall] Cleaning up signaling channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, userId]);

  const createPeerConnection = useCallback(() => {
    console.log('🔗 [WebRTCVideoCall] Creating peer connection');
    
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        console.log('🧊 [WebRTCVideoCall] Sending ICE candidate');
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            fromUser: userId
          }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📹 [WebRTCVideoCall] Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔄 [WebRTCVideoCall] Connection state changed:', pc.connectionState);
      setConnectionState(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        toast({
          title: "✅ Connected",
          description: "Video call connection established",
        });
      } else if (pc.connectionState === 'failed') {
        toast({
          title: "❌ Connection Failed",
          description: "Please try reconnecting",
          variant: "destructive"
        });
      }
    };

    return pc;
  }, [userId, toast]);

  const handleOffer = useCallback(async (payload: any) => {
    if (payload.payload.fromUser === userId) return; // Ignore own offers
    
    console.log('📥 [WebRTCVideoCall] Received offer');
    
    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    await pc.setRemoteDescription(payload.payload.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          fromUser: userId
        }
      });
    }
  }, [userId, createPeerConnection]);

  const handleAnswer = useCallback(async (payload: any) => {
    if (payload.payload.fromUser === userId) return; // Ignore own answers
    
    console.log('📥 [WebRTCVideoCall] Received answer');
    
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(payload.payload.answer);
    }
  }, [userId]);

  const handleIceCandidate = useCallback(async (payload: any) => {
    if (payload.payload.fromUser === userId) return; // Ignore own candidates
    
    console.log('📥 [WebRTCVideoCall] Received ICE candidate');
    
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(payload.payload.candidate);
    }
  }, [userId]);

  const handleEndCall = useCallback((payload: any) => {
    if (payload.payload.fromUser === userId) return; // Ignore own end call
    
    console.log('📥 [WebRTCVideoCall] Received end call signal');
    endCall(false); // Don't send another end call signal
  }, [userId]);

  const startCall = async () => {
    try {
      console.log('📞 [WebRTCVideoCall] Starting call...');
      setIsConnecting(true);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCallActive(true);

      // Create peer connection and add tracks
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // If physician, create and send offer
      if (userRole === 'physician') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'offer',
            payload: {
              offer,
              fromUser: userId
            }
          });
        }
      }

      toast({
        title: "📞 Video Call Started",
        description: `${userRole} ready for video call`,
      });

    } catch (error) {
      console.error('❌ [WebRTCVideoCall] Error starting call:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: `Failed to start video call: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const endCall = (sendSignal = true) => {
    console.log('📞 [WebRTCVideoCall] Ending call');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Send end call signal
    if (sendSignal && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: {
          fromUser: userId
        }
      });
    }

    setIsCallActive(false);
    setConnectionState('new');
    setIsConnecting(false);

    toast({
      title: "📞 Call Ended",
      description: "Video call has been terminated",
    });
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
        console.log(`📹 [WebRTCVideoCall] Video ${!videoEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
        console.log(`🎤 [WebRTCVideoCall] Audio ${!audioEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };

  return {
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
  };
};
