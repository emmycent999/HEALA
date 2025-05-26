
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Bot, User, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AIBot } from './AIBot';
import { Message, Conversation } from '@/types/chat';

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
      
      // Map the data to ensure sender_type is properly typed
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'patient' | 'physician' | 'ai_bot'
      }));
      
      setMessages(typedMessages);
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
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages(prev => [...prev, {
          ...newMessage,
          sender_type: newMessage.sender_type as 'patient' | 'physician' | 'ai_bot'
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (content: string, senderType: 'patient' | 'physician' | 'ai_bot' = 'patient') => {
    if (!content.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: senderType === 'ai_bot' ? null : user.id,
          sender_type: senderType,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = newMessage;
    setNewMessage('');
    setLoading(true);

    try {
      await sendMessage(userMessage);

      // If it's an AI diagnosis conversation, get AI response
      if (conversation.type === 'ai_diagnosis') {
        const aiResponse = AIBot.getDiagnosisResponse(userMessage);
        await sendMessage(aiResponse, 'ai_bot');
      }
    } catch (error) {
      console.error('Error in message flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderIcon = (senderType: 'patient' | 'physician' | 'ai_bot') => {
    switch (senderType) {
      case 'ai_bot':
        return <Bot className="w-4 h-4" />;
      case 'physician':
        return <Stethoscope className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getSenderColor = (senderType: 'patient' | 'physician' | 'ai_bot') => {
    switch (senderType) {
      case 'ai_bot':
        return 'bg-blue-100 text-blue-800';
      case 'physician':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">
              {conversation.title || (conversation.type === 'ai_diagnosis' ? 'AI Health Assistant' : 'Physician Consultation')}
            </CardTitle>
            <Badge variant="outline" className="mt-1">
              {conversation.type === 'ai_diagnosis' ? 'AI Diagnosis' : 'Live Consultation'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && conversation.type === 'ai_diagnosis' && (
            <div className="text-center p-4">
              <Bot className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">{AIBot.getGreeting()}</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_id === user?.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`p-1 rounded ${getSenderColor(message.sender_type)}`}>
                    {getSenderIcon(message.sender_type)}
                  </div>
                  <span className="text-xs font-medium">
                    {message.sender_type === 'ai_bot' ? 'AI Assistant' : 
                     message.sender_type === 'physician' ? 'Physician' : 'You'}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === user?.id ? 'text-purple-200' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={loading || !newMessage.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
