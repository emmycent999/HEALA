
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Send, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AIBot } from './AIBot';

interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician' | 'ai_bot';
  created_at: string;
  sender_id?: string;
}

interface Conversation {
  id: string;
  type: 'ai_diagnosis' | 'physician_consultation';
  title?: string;
  status: string;
  physician?: {
    first_name: string;
    last_name: string;
    specialization: string;
  };
}

interface ChatInterfaceProps {
  conversation: Conversation;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
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
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: 'patient',
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');

      // If it's an AI conversation, trigger AI response
      if (conversation.type === 'ai_diagnosis') {
        const aiResponse = AIBot.getDiagnosisResponse(newMessage);
        
        setTimeout(async () => {
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              sender_type: 'ai_bot',
              content: aiResponse,
              message_type: 'text'
            });
        }, 1000);
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              ← Back
            </Button>
            <div className="flex items-center space-x-2">
              {conversation.type === 'ai_diagnosis' ? (
                <Bot className="w-5 h-5 text-blue-500" />
              ) : (
                <User className="w-5 h-5 text-green-500" />
              )}
              <div>
                <CardTitle className="text-lg">
                  {conversation.type === 'ai_diagnosis' 
                    ? 'AI Health Assistant' 
                    : `Dr. ${conversation.physician?.first_name} ${conversation.physician?.last_name}`
                  }
                </CardTitle>
                {conversation.physician && (
                  <p className="text-sm text-gray-600">{conversation.physician.specialization}</p>
                )}
              </div>
            </div>
          </div>
          <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
            {conversation.status}
          </Badge>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_type === 'patient'
                      ? 'bg-purple-600 text-white'
                      : message.sender_type === 'ai_bot'
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender_type === 'ai_bot' && <Bot className="w-4 h-4" />}
                    {message.sender_type === 'physician' && <User className="w-4 h-4" />}
                    {message.sender_type === 'patient' && <MessageSquare className="w-4 h-4" />}
                    <span className="text-xs font-medium">
                      {message.sender_type === 'ai_bot' 
                        ? 'AI Assistant' 
                        : message.sender_type === 'physician'
                        ? 'Doctor'
                        : 'You'
                      }
                    </span>
                  </div>
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
