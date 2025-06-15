
import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useEnhancedChat } from './hooks/useEnhancedChat';
import { ChatHeaderSection } from './ChatHeaderSection';
import { MessageDisplay } from './MessageDisplay';
import { MessageInputSection } from './MessageInputSection';
import { EnhancedChatProps } from './types';

export const EnhancedPatientPhysicianChat: React.FC<EnhancedChatProps> = ({
  conversationId,
  onBack
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    loading,
    sending,
    typingUsers,
    handleTyping,
    sendMessage
  } = useEnhancedChat(conversationId);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading chat...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <ChatHeaderSection onBack={onBack} />

      <CardContent className="flex-1 flex flex-col p-0">
        <MessageDisplay 
          messages={messages}
          currentUserId={user?.id}
          typingUsers={typingUsers}
        />
        <div ref={messagesEndRef} />

        <MessageInputSection
          onSendMessage={sendMessage}
          onTyping={handleTyping}
          disabled={sending}
        />
      </CardContent>
    </Card>
  );
};
