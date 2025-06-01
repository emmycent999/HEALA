
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedAIBot } from './EnhancedAIBot';
import { ChatList } from './ChatList';
import { PhysicianSelector } from './PhysicianSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageCircle, Stethoscope } from 'lucide-react';

interface ChatInterfaceProps {
  conversationId?: string;
  title?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, title }) => {
  const [activeTab, setActiveTab] = useState(conversationId ? "physician" : "ai");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  useEffect(() => {
    if (conversationId) {
      setActiveTab("physician");
    }
  }, [conversationId]);

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
  };

  const handlePhysicianSelect = (physicianId: string, physicianName: string) => {
    console.log('Physician selected:', physicianId, physicianName);
  };

  const handlePhysicianBack = () => {
    console.log('Back from physician selector');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {title || "Health Communication"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Health Assistant
              </TabsTrigger>
              <TabsTrigger value="physician" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Chat with Physician
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-6">
              <EnhancedAIBot />
            </TabsContent>

            <TabsContent value="physician" className="mt-6">
              {conversationId ? (
                <div className="text-center p-8">
                  <p>Physician chat interface for conversation: {conversationId}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <PhysicianSelector 
                    onSelect={handlePhysicianSelect}
                    onBack={handlePhysicianBack}
                  />
                  <ChatList onSelectConversation={handleSelectConversation} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
