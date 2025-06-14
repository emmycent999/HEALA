
export interface WebRTCCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: string) => void;
}

export interface SignalingChannel {
  send: (message: string) => void;
}

export interface WebRTCConfiguration {
  iceServers: RTCIceServer[];
}
