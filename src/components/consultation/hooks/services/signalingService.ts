
import { supabase } from '@/integrations/supabase/client';
import { SignalingMessage } from '../types/videoCall';

export class SignalingService {
  private channel: any = null;
  private sessionId: string;
  private userId: string;

  constructor(sessionId: string, userId: string) {
    this.sessionId = sessionId;
    this.userId = userId;
  }

  setupChannel(callbacks: {
    onCallInvitation: (sender: string, senderName: string) => void;
    onCallDeclined: (sender: string) => void;
    onWebRTCSignal: (type: string, data: any, sender: string) => void;
  }) {
    const channelName = `consultation_${this.sessionId}`;
    this.channel = supabase.channel(channelName);

    this.channel
      .on('broadcast', { event: 'call-invitation' }, (payload: any) => {
        const { sender, senderName } = payload.payload;
        if (sender === this.userId) return;
        callbacks.onCallInvitation(sender, senderName);
      })
      .on('broadcast', { event: 'call-declined' }, (payload: any) => {
        const { sender } = payload.payload;
        if (sender === this.userId) return;
        callbacks.onCallDeclined(sender);
      })
      .on('broadcast', { event: 'webrtc-signal' }, (payload: any) => {
        const { type, data, sender } = payload.payload;
        if (sender === this.userId) return;
        callbacks.onWebRTCSignal(type, data, sender);
      })
      .subscribe();
  }

  sendCallInvitation(callerName: string) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'call-invitation',
        payload: { sender: this.userId, senderName: callerName }
      });
    }
  }

  sendCallDeclined() {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'call-declined',
        payload: { sender: this.userId }
      });
    }
  }

  sendWebRTCSignal(type: string, data: any) {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: { type, data, sender: this.userId }
      });
    }
  }

  dispose() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}
