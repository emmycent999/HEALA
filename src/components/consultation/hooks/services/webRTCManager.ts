
import { useRef, useEffect } from 'react';
import { WebRTCService } from '../../services/webRTCService';
import { useToast } from '@/hooks/use-toast';

export const useWebRTCManager = (
  onConnectionStateChange: (state: string) => void
) => {
  const { toast } = useToast();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const webRTCService = useRef<WebRTCService | null>(null);

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
      onConnectionStateChange(state);
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
    };
  }, [onConnectionStateChange, toast]);

  const toggleVideo = (enabled: boolean) => {
    if (webRTCService.current) {
      webRTCService.current.toggleVideo(enabled);
    }
  };

  const toggleAudio = (enabled: boolean) => {
    if (webRTCService.current) {
      webRTCService.current.toggleAudio(enabled);
    }
  };

  const startLocalVideo = async () => {
    if (webRTCService.current) {
      await webRTCService.current.startLocalVideo();
    }
  };

  const createOffer = async () => {
    if (webRTCService.current) {
      return await webRTCService.current.createOffer();
    }
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
    if (webRTCService.current) {
      return await webRTCService.current.createAnswer(offer);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (webRTCService.current) {
      await webRTCService.current.handleAnswer(answer);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (webRTCService.current) {
      await webRTCService.current.handleIceCandidate(candidate);
    }
  };

  const setSignalingChannel = (channel: any) => {
    if (webRTCService.current) {
      webRTCService.current.setSignalingChannel(channel);
    }
  };

  const endCall = () => {
    if (webRTCService.current) {
      webRTCService.current.endCall();
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    webRTCService,
    toggleVideo,
    toggleAudio,
    startLocalVideo,
    createOffer,
    createAnswer,
    handleAnswer,
    handleIceCandidate,
    setSignalingChannel,
    endCall
  };
};
