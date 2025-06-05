
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician';
  sender_id: string;
  created_at: string;
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
  conversationId: propConversationId, 
  onBack 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) {
      if (propConversationId) {
        setConversationId(propConversationId);
        loadConversationData(propConversationId);
      } else {
        initializeChat();
      }
    }
  }, [user, propConversationId]);

  const loadConversationData = async (convId: string) => {
    try {
      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      if (convError) throw convError;

      // Get physician details
      const { data: physicianData, error: physicianError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .eq('id', conversation.physician_id)
        .single();

      if (physicianError) throw physicianError;

      setPhysician({
        id: physicianData.id,
        first_name: physicianData.first_name || 'Unknown',
        last_name: physicianData.last_name || '',
        specialization: physicianData.specialization || 'General'
      });

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      const formattedMessages: ChatMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type as 'patient' | 'physician',
        sender_id: msg.sender_id || '',
        created_at: msg.created_at
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeChat = async () => {
    if (!user) return;

    try {
      // First, get the assigned physician
      const { data: assignment, error: assignmentError } = await supabase
        .from('physician_patients')
        .select('physician_id')
        .eq('patient_id', user.id)
        .eq('status', 'active')
        .single();

      if (assignmentError) {
        if (assignmentError.code === 'PGRST116') {
          toast({
            title: "No Physician Assigned",
            description: "Please request a physician assignment first.",
            variant: "destructive"
          });
        } else {
          throw assignmentError;
        }
        setLoading(false);
        return;
      }

      // Get physician details
      const { data: physicianData, error: physicianError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .eq('id', assignment.physician_id)
        .single();

      if (physicianError) throw physicianError;

      setPhysician({
        id: physicianData.id,
        first_name: physicianData.first_name || 'Unknown',
        last_name: physicianData.last_name || '',
        specialization: physicianData.specialization || 'General'
      });

      // Get or create conversation
      const { data: existingConversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('patient_id', user.id)
        .eq('physician_id', assignment.physician_id)
        .eq('type', 'physician_consultation')
        .single();

      let currentConversationId;

      if (conversationError && conversationError.code === 'PGRST116') {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            patient_id: user.id,
            physician_id: assignment.physician_id,
            type: 'physician_consultation',
            title: `Consultation with Dr. ${physicianData.first_name} ${physicianData.last_name}`,
            status: 'active'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        currentConversationId = newConversation.id;
      } else if (conversationError) {
        throw conversationError;
      } else {
        currentConversationId = existingConversation.id;
      }

      setConversationId(currentConversationId);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      
      const formattedMessages: ChatMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type as 'patient' | 'physician',
        sender_id: msg.sender_id || '',
        created_at: msg.created_at
      }));
      
      setMessages(formattedMessages);

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Error",
        description: "Failed to load physician chat.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    setSendingMessage(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'patient',
          content: content.trim()
        })
        .select()
        .single();

      if (error) throw error;

      const newMessage: ChatMessage = {
        id: data.id,
        content: data.content,
        sender_type: 'patient',
        sender_id: data.sender_id || '',
        created_at: data.created_at
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </Card>
    );
  }

  if (!physician || !conversationId) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No physician assigned for chat</p>
          <p className="text-sm text-gray-500">Please request a physician assignment first</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <ChatHeader physician={physician} onBack={onBack} />
      
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} currentUserId={user?.id} />
      </div>
      
      <MessageInput 
        onSendMessage={sendMessage} 
        loading={sendingMessage}
      />
    </Card>
  );
};
