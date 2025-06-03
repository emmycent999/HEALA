
import React, { useState } from 'react';
import { ChatList } from './ChatList';
import { PatientPhysicianChat } from './PatientPhysicianChat';
import { Conversation } from './types';

export const ChatInterface: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${selectedConversation ? 'hidden lg:block' : ''}`}>
        <ChatList onSelectConversation={handleSelectConversation} />
      </div>
      
      <div className={`lg:col-span-2 ${!selectedConversation ? 'hidden lg:block' : ''}`}>
        {selectedConversation ? (
          selectedConversation.type === 'physician_consultation' ? (
            <PatientPhysicianChat 
              conversationId={selectedConversation.id}
              onBack={handleBackToList}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">AI chat not implemented yet</p>
            </div>
          )
        ) : (
          <div className="hidden lg:flex items-center justify-center h-96 text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};
