
import { ConnectionManager } from './managers/connectionManager';
import { StreamManager } from './managers/streamManager';
import { WebRTCCallbacks, SignalingChannel } from './types/webRTCTypes';

export class WebRTCService {
  private connectionManager: ConnectionManager;
  private streamManager: StreamManager;
  
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onConnectionStateChangeCallback?: (state: string) => void;

  constructor() {
    this.connectionManager = new ConnectionManager();
    this.streamManager = new StreamManager();
    
    this.setupCallbacks();
  }

  private setupCallbacks() {
    this.streamManager.setOnLocalStreamCallback((stream) => {
      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(stream);
      }
    });

    this.connectionManager.setCallbacks({
      onRemoteStream: (stream) => {
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(stream);
        }
      },
      onConnectionStateChange: (state) => {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      }
    });
  }

  async startLocalVideo(): Promise<MediaStream> {
    const stream = await this.streamManager.startLocalVideo();
    
    // Add tracks to peer connection
    stream.getTracks().forEach(track => {
      this.connectionManager.addTrack(track, stream);
    });

    return stream;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return await this.connectionManager.createOffer();
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    return await this.connectionManager.createAnswer(offer);
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.connectionManager.handleAnswer(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.connectionManager.handleIceCandidate(candidate);
  }

  setSignalingChannel(channel: SignalingChannel) {
    this.connectionManager.setSignalingChannel(channel);
  }

  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionStateChange(callback: (state: string) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  toggleVideo(enabled: boolean) {
    this.streamManager.toggleVideo(enabled);
  }

  toggleAudio(enabled: boolean) {
    this.streamManager.toggleAudio(enabled);
  }

  endCall() {
    this.streamManager.stopLocalStream();
    this.connectionManager.close();
  }

  dispose() {
    this.streamManager.stopLocalStream();
    this.connectionManager.dispose();
  }
}
