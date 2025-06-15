
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Message, TypingIndicator } from '../types';

export const useEnhancedChat = (conversationId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (conversationId && user) {
      fetchMessages();
      subscribeToMessages();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, user]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const transformedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type,
        sender_id: msg.sender_id,
        is_read: false,
        read_at: undefined,
        message_attachments: msg.metadata,
        created_at: msg.created_at
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          const transformedMessage: Message = {
            id: newMsg.id,
            content: newMsg.content,
            sender_type: newMsg.sender_type,
            sender_id: newMsg.sender_id,
            is_read: false,
            read_at: undefined,
            message_attachments: newMsg.metadata,
            created_at: newMsg.created_at
          };
          setMessages(current => [...current, transformedMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMsg = payload.new as any;
          const transformedMessage: Message = {
            id: updatedMsg.id,
            content: updatedMsg.content,
            sender_type: updatedMsg.sender_type,
            sender_id: updatedMsg.sender_id,
            is_read: false,
            read_at: undefined,
            message_attachments: updatedMsg.metadata,
            created_at: updatedMsg.created_at
          };
          setMessages(current => 
            current.map(msg => 
              msg.id === transformedMessage.id ? transformedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTyping = async () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing after 3 seconds
    }, 3000);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content: content,
          sender_id: user?.id,
          sender_type: 'patient'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    typingUsers,
    handleTyping,
    sendMessage
  };
};
