
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useConsultationSession } from './hooks/useConsultationSession';
import { ConsultationSessionHeader } from './ConsultationSessionHeader';
import { VideoInterface } from './VideoInterface';
import { SessionSummary } from './SessionSummary';
import { EmptySessionState } from './EmptySessionState';
import { SessionList } from './SessionList';
import { VirtualConsultationRoomProps } from './types';

export const VirtualConsultationRoom: React.FC<VirtualConsultationRoomProps> = ({ sessionId }) => {
  const {
    session,
    loading,
    sessionDuration,
    connectionStatus,
    startSession,
    endSession,
    formatDuration
  } = useConsultationSession(sessionId);

  const handleSelectSession = (selectedSessionId: string) => {
    // Update the URL to include the session ID
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('session', selectedSessionId);
    window.history.pushState({}, '', currentUrl.toString());
    
    // Reload the component with the new session ID
    window.location.reload();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading consultation room...</div>
        </CardContent>
      </Card>
    );
  }

  // If no sessionId is provided, show the session list
  if (!sessionId) {
    return (
      <div className="space-y-6">
        <SessionList onSelectSession={handleSelectSession} />
        <EmptySessionState />
      </div>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600">Session not found or access denied.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ConsultationSessionHeader
        session={session}
        connectionStatus={connectionStatus}
        sessionDuration={sessionDuration}
        formatDuration={formatDuration}
      />

      <VideoInterface
        session={session}
        onStartSession={startSession}
        onEndSession={endSession}
      />

      <SessionSummary
        session={session}
        formatDuration={formatDuration}
      />
    </div>
  );
};
