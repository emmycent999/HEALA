
import React from 'react';

interface VideoStreamsProps {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isCallActive: boolean;
  connectionState: string;
}

export const VideoStreams: React.FC<VideoStreamsProps> = ({
  localVideoRef,
  remoteVideoRef,
  isCallActive,
  connectionState
}) => {
  return (
    <>
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ display: connectionState === 'connected' ? 'block' : 'none' }}
      />
      
      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white shadow-lg"
        style={{ display: isCallActive ? 'block' : 'none' }}
      />
    </>
  );
};
