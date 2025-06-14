
export interface UseVideoCallProps {
  sessionId: string;
  userId: string;
  userRole: 'patient' | 'physician';
  sessionStatus: string;
}

export interface VideoCallState {
  isCallActive: boolean;
  connectionState: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  incomingCall: boolean;
  callInitiator: string;
}

export interface SignalingMessage {
  type: 'call-invitation' | 'call-declined' | 'webrtc-signal';
  payload: any;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  sender: string;
}
