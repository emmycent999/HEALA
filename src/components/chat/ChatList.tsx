
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PhysicianSelector } from './PhysicianSelector';
import { AIBot } from './AIBot';
import { Conversation } from './types';
import { ChatListActions } from './ChatListActions';
import { ConversationItem } from './ConversationItem';

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
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch physician data separately
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          let physician = null;
          if (conv.physician_id) {
            const { data: physicianData } = await supabase
              .from('profiles')
              .select('first_name, last_name, specialization')
              .eq('id', conv.physician_id)
              .single();
            
            if (physicianData) {
              physician = {
                first_name: physicianData.first_name || '',
                last_name: physicianData.last_name || '',
                specialization: physicianData.specialization || ''
              };
            }
          }

          return {
            id: conv.id,
            type: conv.type as 'ai_diagnosis' | 'physician_consultation',
            title: conv.title || undefined,
            status: conv.status || 'active',
            created_at: conv.created_at || new Date().toISOString(),
            physician
          };
        })
      );
      
      setConversations(conversationsWithDetails);
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

      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'ai_bot',
          content: AIBot.getGreeting()
        });

      const newConversation: Conversation = {
        id: data.id,
        type: 'ai_diagnosis',
        title: 'AI Health Assessment',
        status: 'active',
        created_at: data.created_at || new Date().toISOString(),
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

      await supabase
        .from('messages')
        .insert({
          conversation_id: data.id,
          sender_type: 'physician',
          content: `Hello! I'm ${physicianName}. How can I help you today?`
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
          <ChatListActions 
            onStartAIChat={startAIChat}
            onStartPhysicianChat={() => setShowPhysicianSelector(true)}
          />

          {conversations.length > 0 && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Recent Conversations</h4>
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      onClick={() => onSelectConversation(conversation)}
                    />
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
