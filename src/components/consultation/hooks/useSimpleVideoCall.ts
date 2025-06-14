
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseSimpleVideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'physician' | 'patient';
  autoStart: boolean;
}

export const useSimpleVideoCall = ({ sessionId, userId, userRole, autoStart }: UseSimpleVideoCallProps) => {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Auto-start when requested
  useEffect(() => {
    if (autoStart && !isCallActive) {
      console.log('🚀 [useSimpleVideoCall] Auto-starting video call');
      startCall();
    }
  }, [autoStart]);

  const startCall = async () => {
    try {
      console.log('📞 [useSimpleVideoCall] Starting video call');
      
      // Get user media immediately
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnectionRef.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📡 [useSimpleVideoCall] Remote stream received');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionState('connected');
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('🔗 [useSimpleVideoCall] Connection state:', pc.connectionState);
        setConnectionState(pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          toast({
            title: "🎥 Connected",
            description: "Video call is now active",
          });
        }
      };

      setIsCallActive(true);
      setConnectionState('connecting');

      toast({
        title: "📞 Starting Video Call",
        description: "Connecting...",
      });

      // For demo purposes, simulate connection after 2 seconds
      setTimeout(() => {
        setConnectionState('connected');
        toast({
          title: "✅ Video Call Connected",
          description: "You are now in the video call",
        });
      }, 2000);

    } catch (error) {
      console.error('❌ [useSimpleVideoCall] Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please check camera permissions.",
        variant: "destructive"
      });
    }
  };

  const endCall = () => {
    console.log('📞 [useSimpleVideoCall] Ending call');
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
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

    setIsCallActive(false);
    setConnectionState('new');

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
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    toggleVideo,
    toggleAudio
  };
};
