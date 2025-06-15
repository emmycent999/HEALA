
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'patient' | 'physician';
  created_at: string;
}

interface VideoCallChatProps {
  sessionId: string;
  currentUserId: string;
  onClose: () => void;
}

export const VideoCallChat: React.FC<VideoCallChatProps> = ({
  sessionId,
  currentUserId,
  onClose
}) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages from conversations/messages tables temporarily
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Try to find or create a conversation for this session
        const { data: conversations, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('title', `Video Session ${sessionId}`)
          .limit(1);

        if (convError) {
          console.error('❌ Error loading conversations:', convError);
          return;
        }

        let conversationId = conversations?.[0]?.id;

        if (!conversationId) {
          // Create a conversation for this session
          const { data: session } = await supabase
            .from('consultation_sessions')
            .select('patient_id, physician_id')
            .eq('id', sessionId)
            .single();

          if (session) {
            const { data: newConv, error: createError } = await supabase
              .from('conversations')
              .insert({
                title: `Video Session ${sessionId}`,
                patient_id: session.patient_id,
                physician_id: session.physician_id,
                type: 'physician_consultation'
              })
              .select('id')
              .single();

            if (!createError && newConv) {
              conversationId = newConv.id;
            }
          }
        }

        if (conversationId) {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          
          // Map messages to ChatMessage format
          const chatMessages: ChatMessage[] = (data || []).map(msg => ({
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id || '',
            sender_type: msg.sender_type as 'patient' | 'physician',
            created_at: msg.created_at || new Date().toISOString()
          }));
          
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error('❌ Error loading chat messages:', error);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Set up real-time message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`video_chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.conversation_id) {
            const chatMessage: ChatMessage = {
              id: newMsg.id,
              content: newMsg.content,
              sender_id: newMsg.sender_id || '',
              sender_type: newMsg.sender_type as 'patient' | 'physician',
              created_at: newMsg.created_at || new Date().toISOString()
            };
            setMessages(prev => [...prev, chatMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Find or create conversation
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('title', `Video Session ${sessionId}`)
        .limit(1);

      let conversationId = conversations?.[0]?.id;

      if (!conversationId) {
        const { data: session } = await supabase
          .from('consultation_sessions')
          .select('patient_id, physician_id')
          .eq('id', sessionId)
          .single();

        if (session) {
          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              title: `Video Session ${sessionId}`,
              patient_id: session.patient_id,
              physician_id: session.physician_id,
              type: 'physician_consultation'
            })
            .select('id')
            .single();

          conversationId = newConv?.id;
        }
      }

      if (conversationId) {
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            content: newMessage.trim(),
            sender_id: currentUserId,
            sender_type: profile?.role === 'physician' ? 'physician' : 'patient'
          });

        if (error) throw error;
        setNewMessage('');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast({
        title: "❌ Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <h3 className="font-semibold">Chat</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Start a conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    message.sender_id === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
