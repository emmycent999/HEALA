
import React from 'react';

interface VideoConnectionStatusProps {
  isCallActive: boolean;
  connectionState: string;
}

export const VideoConnectionStatus: React.FC<VideoConnectionStatusProps> = ({
  isCallActive,
  connectionState
}) => {
  if (!isCallActive || connectionState === 'connected') {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-lg">
          {connectionState === 'connecting' ? 'Connecting to video call...' :
           connectionState === 'new' ? 'Initializing video call...' :
           connectionState === 'failed' ? 'Connection failed' :
           connectionState}
        </p>
      </div>
    </div>
  );
};
