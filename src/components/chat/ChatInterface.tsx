
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { EnhancedAIBot } from './EnhancedAIBot';

interface Message {
  id: string;
  content: string;
  sender_type: 'patient' | 'physician' | 'ai_bot';
  sender_id?: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'file';
  metadata?: any;
}

interface ChatInterfaceProps {
  conversation: any;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversation, onBack }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            sender_type: newMsg.sender_type as 'patient' | 'physician' | 'ai_bot',
            sender_id: newMsg.sender_id,
            created_at: newMsg.created_at,
            message_type: newMsg.message_type || 'text',
            metadata: newMsg.metadata
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        sender_type: msg.sender_type as 'patient' | 'physician' | 'ai_bot',
        sender_id: msg.sender_id || undefined,
        created_at: msg.created_at,
        message_type: (msg.message_type as 'text' | 'image' | 'file') || 'text',
        metadata: msg.metadata
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: newMessage,
          sender_type: 'patient',
          sender_id: user.id,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');

      // If it's an AI conversation, get AI response
      if (conversation.type === 'ai_diagnosis') {
        setTimeout(async () => {
          const aiResponse = EnhancedAIBot.getDiagnosisResponse(newMessage);
          
          await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              content: aiResponse,
              sender_type: 'ai_bot',
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

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai_bot': return <Bot className="w-4 h-4" />;
      case 'physician': return <Stethoscope className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'ai_bot': return 'AI Assistant';
      case 'physician': return 'Dr. Smith';
      default: return 'You';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle className="text-lg">{conversation.title || 'Chat'}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {conversation.type === 'ai_diagnosis' ? 'AI Diagnosis' : 'Physician Consultation'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender_type === 'patient' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender_type === 'ai_bot' ? 'bg-purple-100 text-purple-600' :
                  message.sender_type === 'physician' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {getSenderIcon(message.sender_type)}
                </div>
                <div className={`flex-1 max-w-xs lg:max-w-md ${
                  message.sender_type === 'patient' ? 'text-right' : ''
                }`}>
                  <div className={`rounded-lg p-3 ${
                    message.sender_type === 'patient' 
                      ? 'bg-purple-600 text-white ml-auto' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {getSenderName(message.sender_type)} • {new Date(message.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
