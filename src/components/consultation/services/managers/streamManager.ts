
export class StreamManager {
  private localStream: MediaStream | null = null;
  private onLocalStreamCallback?: (stream: MediaStream) => void;

  setOnLocalStreamCallback(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  async startLocalVideo(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (this.onLocalStreamCallback) {
        this.onLocalStreamCallback(this.localStream);
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}
