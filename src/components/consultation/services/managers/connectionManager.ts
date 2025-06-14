
import { WebRTCConfiguration, WebRTCCallbacks, SignalingChannel } from '../types/webRTCTypes';

export class ConnectionManager {
  private peerConnection: RTCPeerConnection | null = null;
  private signalingChannel: SignalingChannel | null = null;
  private callbacks: WebRTCCallbacks = {};

  constructor() {
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    const configuration: WebRTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingChannel) {
        this.signalingChannel.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };

    this.peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(remoteStream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.callbacks.onConnectionStateChange && this.peerConnection) {
        this.callbacks.onConnectionStateChange(this.peerConnection.connectionState);
      }
    };
  }

  setCallbacks(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
  }

  setSignalingChannel(channel: SignalingChannel) {
    this.signalingChannel = channel;
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    if (this.peerConnection) {
      this.peerConnection.addTrack(track, stream);
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    
    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.addIceCandidate(candidate);
  }

  close() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.setupPeerConnection();
    }
  }

  dispose() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
