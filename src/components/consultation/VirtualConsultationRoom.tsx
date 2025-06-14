
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useConsultationSession } from './hooks/useConsultationSession';
import { ConsultationSessionHeader } from './ConsultationSessionHeader';
import { VideoInterface } from './VideoInterface';
import { SessionSummary } from './SessionSummary';
import { EmptySessionState } from './EmptySessionState';
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading consultation room...</div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionId) {
    return <EmptySessionState />;
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
