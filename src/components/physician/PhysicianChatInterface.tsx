
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Users, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WorkingAIBot } from '@/components/chat/WorkingAIBot';
import { PatientPhysicianChat } from '@/components/chat/PatientPhysicianChat';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Physician {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
}

interface Conversation {
  id: string;
  patient_id: string;
  physician_id: string;
  title: string;
  status: string;
  created_at: string;
  patient_name: string;
}

export const PhysicianChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');

  useEffect(() => {
    fetchPatients();
    fetchPhysicians();
    fetchConversations();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'patient')
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhysicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, specialization')
        .eq('role', 'physician')
        .neq('id', user?.id)
        .limit(10);

      if (error) throw error;
      setPhysicians(data || []);
    } catch (error) {
      console.error('Error fetching physicians:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      // First get conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .eq('physician_id', user?.id)
        .eq('type', 'physician_consultation')
        .order('created_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Then get patient details for each conversation
      const conversationsWithPatients = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const { data: patientData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', conv.patient_id)
            .single();

          return {
            id: conv.id,
            patient_id: conv.patient_id,
            physician_id: conv.physician_id,
            title: conv.title,
            status: conv.status,
            created_at: conv.created_at,
            patient_name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Unknown Patient'
          };
        })
      );

      setConversations(conversationsWithPatients);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const startNewConversation = async (patientId: string, patientName: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          patient_id: patientId,
          physician_id: user.id,
          type: 'physician_consultation',
          title: `Consultation with Dr. ${user.user_metadata?.first_name || 'Physician'}`,
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
          sender_id: user.id,
          content: `Hello ${patientName}! I'm ready to help you with your health concerns. How can I assist you today?`
        });

      setSelectedConversation(data.id);
      fetchConversations();
      
      toast({
        title: "Conversation Started",
        description: `New consultation started with ${patientName}`,
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Physician Communication Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Chat
              </TabsTrigger>
              <TabsTrigger value="physicians" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Physician Chat
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="patients" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Patients & Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Active Conversations</h4>
                        {conversations.length === 0 ? (
                          <p className="text-sm text-gray-600">No active conversations</p>
                        ) : (
                          <div className="space-y-2">
                            {conversations.map((conversation) => (
                              <div
                                key={conversation.id}
                                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => setSelectedConversation(conversation.id)}
                              >
                                <div className="font-medium text-sm">{conversation.patient_name}</div>
                                <div className="text-xs text-gray-500">
                                  {new Date(conversation.created_at).toLocaleDateString()}
                                </div>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {conversation.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm mb-2">Start New Conversation</h4>
                        {patients.length === 0 ? (
                          <p className="text-sm text-gray-600">No patients available</p>
                        ) : (
                          <div className="space-y-2">
                            {patients.map((patient) => (
                              <div
                                key={patient.id}
                                className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                                onClick={() => startNewConversation(patient.id, `${patient.first_name} ${patient.last_name}`)}
                              >
                                <div className="font-medium text-sm">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-xs text-gray-600">{patient.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2">
                  <PatientPhysicianChat conversationId={selectedConversation || undefined} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physicians" className="mt-6">
              <div className="text-center py-8 text-gray-500">
                Physician-to-physician chat coming soon
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <WorkingAIBot />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
