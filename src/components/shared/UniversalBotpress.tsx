
import React from 'react';

export const UniversalBotpress: React.FC = () => {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-white">
      <iframe
        src="https://cdn.botpress.cloud/webchat/v2.4/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/20/01/20250120013114-HPA1X0O0.json"
        width="100%"
        height="100%"
        frameBorder="0"
        title="AI Health Assistant"
        className="w-full h-full rounded-lg"
        allow="microphone; camera"
      />
    </div>
  );
};
