
import { supabase } from '@/integrations/supabase/client';
import { Message } from '../types';

export const fetchMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  
  return (data || []).map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    sender_type: msg.sender_type,
    sender_id: msg.sender_id,
    is_read: false,
    read_at: undefined,
    message_attachments: msg.metadata,
    created_at: msg.created_at
  }));
};

export const sendMessage = async (
  conversationId: string,
  content: string,
  userId?: string
): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content,
      sender_id: userId,
      sender_type: 'patient'
    });

  if (error) throw error;
};
