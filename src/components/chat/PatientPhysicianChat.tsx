
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician';
  sender_id: string;
  created_at: string;
  sender_name?: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface PatientPhysicianChatProps {
  conversationId?: string;
  onBack?: () => void;
}

export const PatientPhysicianChat: React.FC<PatientPhysicianChatProps> = ({ 
  conversationId, 
  onBack 
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversationDetails();
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversationDetails = async () => {
    if (!conversationId) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;
      setConversation(convData);

      // Fetch physician details separately
      if (convData.physician_id) {
        const { data: physicianData, error: physicianError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, specialization')
          .eq('id', convData.physician_id)
          .single();

        if (physicianError) throw physicianError;
        setPhysician(physicianData);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation details.",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithSenders = await Promise.all(
        (messagesData || []).map(async (msg) => {
          if (msg.sender_id) {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', msg.sender_id)
              .single();

            return {
              id: msg.id,
              content: msg.content,
              sender_type: msg.sender_type as 'patient' | 'physician',
              sender_id: msg.sender_id,
              created_at: msg.created_at,
              sender_name: senderData ? `${senderData.first_name} ${senderData.last_name}` : 'Unknown'
            };
          }
          return {
            id: msg.id,
            content: msg.content,
            sender_type: msg.sender_type as 'patient' | 'physician',
            sender_id: msg.sender_id || '',
            created_at: msg.created_at,
            sender_name: 'Unknown'
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive"
      });
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (messageContent: string) => {
    if (!conversationId || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: profile?.role === 'physician' ? 'physician' : 'patient',
          content: messageContent
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!conversationId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            Select a conversation to start chatting
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <ChatHeader physician={physician} onBack={onBack} />
      <CardContent className="flex-1 flex flex-col p-0">
        <MessageList messages={messages} currentUserId={user?.id} />
        <MessageInput onSendMessage={sendMessage} loading={loading} />
        <div ref={messagesEndRef} />
      </CardContent>
    </Card>
  );
};
