
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Plus, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PhysicianSelector } from './PhysicianSelector';
import { AIBot } from './AIBot';

interface Conversation {
  id: string;
  type: 'ai_diagnosis' | 'physician_consultation';
  title?: string;
  status: string;
  created_at: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

interface ChatListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onSelectConversation }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhysicianSelector, setShowPhysicianSelector] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          title,
          status,
          created_at,
          physician:profiles!conversations_physician_id_fkey (
            first_name,
            last_name,
            specialization
          )
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startAIChat = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: user.id,
          type: 'ai_diagnosis',
          title: 'AI Health Assessment',
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial AI greeting
      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'ai_bot',
          content: AIBot.getGreeting(),
          message_type: 'text'
        });

      const newConversation = {
        ...data,
        physician: undefined
      };

      onSelectConversation(newConversation);
    } catch (error) {
      console.error('Error starting AI chat:', error);
      toast({
        title: "Error",
        description: "Failed to start AI chat.",
        variant: "destructive"
      });
    }
  };

  const startPhysicianChat = async (physicianId: string, physicianName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: user.id,
          physician_id: physicianId,
          type: 'physician_consultation',
          title: `Consultation with ${physicianName}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Add initial message
      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'physician',
          content: `Hello! I'm ${physicianName}. How can I help you today?`,
          message_type: 'text'
        });

      fetchConversations();
      setShowPhysicianSelector(false);
    } catch (error) {
      console.error('Error starting physician chat:', error);
      toast({
        title: "Error",
        description: "Failed to start physician consultation.",
        variant: "destructive"
      });
    }
  };

  if (showPhysicianSelector) {
    return (
      <PhysicianSelector
        onSelect={startPhysicianChat}
        onBack={() => setShowPhysicianSelector(false)}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading conversations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>Chat & Consultations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Button onClick={startAIChat} className="w-full justify-start">
              <Bot className="w-4 h-4 mr-2" />
              Start AI Health Assessment
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPhysicianSelector(true)}
              className="w-full justify-start"
            >
              <User className="w-4 h-4 mr-2" />
              Consult with Physician
            </Button>
          </div>

          {conversations.length > 0 && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Recent Conversations</h4>
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => onSelectConversation(conversation)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {conversation.type === 'ai_diagnosis' ? (
                            <Bot className="w-4 h-4 text-blue-500" />
                          ) : (
                            <User className="w-4 h-4 text-green-500" />
                          )}
                          <span className="font-medium text-sm">
                            {conversation.title || 'Untitled Conversation'}
                          </span>
                        </div>
                        <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                          {conversation.status}
                        </Badge>
                      </div>
                      {conversation.physician && (
                        <p className="text-xs text-gray-600">
                          Dr. {conversation.physician.first_name} {conversation.physician.last_name} - {conversation.physician.specialization}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conversation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
