
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, MessageCircle, User, Send, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Message, Conversation } from '@/types/chat';
import { EnhancedAIBot } from './EnhancedAIBot';

export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('patient_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
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
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        if (newMessage.conversation_id === selectedConversation) {
          setMessages(prev => [...prev, newMessage]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: user?.id,
          sender_type: 'patient',
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive"
      });
    }
  };

  const startNewConversation = async (type: 'ai_diagnosis' | 'physician_consultation') => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: user?.id,
          type,
          title: type === 'ai_diagnosis' ? 'AI Health Assistant' : 'Physician Consultation'
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      setSelectedConversation(data.id);
      
      // Send initial AI message for AI diagnosis
      if (type === 'ai_diagnosis') {
        await supabase
          .from('messages')
          .insert({
            conversation_id: data.id,
            sender_type: 'ai_bot',
            content: 'Hello! I\'m your AI health assistant. How can I help you today?',
            message_type: 'text'
          });
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Conversations</span>
          </CardTitle>
          <CardDescription>Your chat history and consultations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={() => startNewConversation('ai_diagnosis')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Bot className="w-4 h-4 mr-2" />
              AI Health Assistant
            </Button>
            <Button 
              onClick={() => startNewConversation('physician_consultation')}
              variant="outline"
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              Talk to Doctor
            </Button>
          </div>
          
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id 
                    ? 'bg-purple-50 border-purple-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{conversation.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {conversation.type === 'ai_diagnosis' ? 'AI' : 'Doctor'}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat Window */}
      <div className="md:col-span-2">
        {selectedConversation ? (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {conversations.find(c => c.id === selectedConversation)?.title || 'Chat'}
                </span>
                <Badge>
                  {conversations.find(c => c.id === selectedConversation)?.type === 'ai_diagnosis' ? 'AI Assistant' : 'Doctor Chat'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center">Loading messages...</div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${
                      message.sender_type === 'patient' ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender_type === 'patient' 
                          ? 'bg-purple-600 text-white' 
                          : message.sender_type === 'ai_bot'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="ai" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
              <TabsTrigger value="doctor">Find Doctor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="h-full">
              <EnhancedAIBot />
            </TabsContent>
            
            <TabsContent value="doctor" className="h-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-6 h-6" />
                    <span>Connect with a Doctor</span>
                  </CardTitle>
                  <CardDescription>Get professional medical consultation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Professional Consultation</h3>
                    <p className="text-gray-600 mb-4">Connect with certified physicians for medical advice</p>
                    <Button 
                      onClick={() => startNewConversation('physician_consultation')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Start Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
