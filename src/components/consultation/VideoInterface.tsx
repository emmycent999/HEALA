
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle } from 'lucide-react';
import { ConsultationSession } from './types';

interface VideoInterfaceProps {
  session: ConsultationSession;
  onStartSession: () => void;
  onEndSession: () => void;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({
  session,
  onStartSession,
  onEndSession
}) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-gray-900 aspect-video rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Video Call Interface</p>
              <p className="text-sm opacity-75">
                {session.status === 'scheduled' ? 'Waiting to start...' : 
                 session.status === 'in_progress' ? 'Session in progress' :
                 'Session ended'}
              </p>
            </div>
          </div>
          
          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4 bg-black bg-opacity-50 rounded-full px-6 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`rounded-full ${videoEnabled ? 'text-white' : 'text-red-400'}`}
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`rounded-full ${audioEnabled ? 'text-white' : 'text-red-400'}`}
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              {session.status === 'scheduled' && (
                <Button
                  onClick={onStartSession}
                  className="bg-green-600 hover:bg-green-700 rounded-full"
                >
                  Start Session
                </Button>
              )}

              {session.status === 'in_progress' && (
                <Button
                  onClick={onEndSession}
                  variant="destructive"
                  className="rounded-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="text-white rounded-full"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
