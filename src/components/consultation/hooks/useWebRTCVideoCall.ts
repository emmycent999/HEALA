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

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
    ]
  };

  const updateRoomJoinStatus = useCallback(async (joined: boolean) => {
    try {
      const updateField = userRole === 'patient' ? 'patient_joined' : 'physician_joined';
      await supabase
        .from('consultation_rooms')
        .update({ [updateField]: joined })
        .eq('session_id', sessionId);
    } catch (error) {
      console.error('Error updating room join status:', error);
    }
  }, [sessionId, userRole]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const channelName = `webrtc_${sessionId}`;
    channelRef.current = supabase.channel(channelName);

    const handleOffer = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      
      setIsConnecting(true);
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

      channelRef.current?.send({
        type: 'broadcast',
        event: 'answer',
        payload: { answer, fromUser: userId }
      });
    };

    const handleAnswer = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(payload.payload.answer);
      }
    };

    const handleIceCandidate = async (payload: any) => {
      if (payload.payload.fromUser === userId) return;
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(payload.payload.candidate);
      }
    };

    channelRef.current
      .on('broadcast', { event: 'offer' }, handleOffer)
      .on('broadcast', { event: 'answer' }, handleAnswer)
      .on('broadcast', { event: 'ice-candidate' }, handleIceCandidate)
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId, userId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(rtcConfig);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, fromUser: userId }
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        toast({ title: "Connected", description: "Video call connected" });
      }
    };

    return pc;
  }, [userId, toast]);

  const startCall = async () => {
    try {
      setIsConnecting(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsCallActive(true);
      await updateRoomJoinStatus(true);

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Auto-start WebRTC negotiation for both users
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        channelRef.current?.send({
          type: 'broadcast',
          event: 'offer',
          payload: { offer, fromUser: userId }
        });
      }, 2000);

    } catch (error) {
      console.error('Error starting call:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to start video call",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    updateRoomJoinStatus(false);
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setIsCallActive(false);
    setConnectionState('new');
    setIsConnecting(false);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
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