
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

interface Message {
  id: string;
  content: string;
  sender_type: string;
  created_at: string;
  sender_id: string;
}

export const PhysicianChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedPhysician, setSelectedPhysician] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients');

  useEffect(() => {
    fetchPatients();
    fetchPhysicians();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMessages(selectedPatient);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (selectedPhysician) {
      fetchPhysicianMessages(selectedPhysician);
    }
  }, [selectedPhysician]);

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

  const fetchPatientMessages = async (patientId: string) => {
    try {
      // This is a simplified version - you would need to implement conversation logic
      setMessages([]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPhysicianMessages = async (physicianId: string) => {
    try {
      // This is a simplified version - you would need to implement conversation logic
      setMessages([]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || (!selectedPatient && !selectedPhysician) || !user) return;

    try {
      // This would be where you implement the actual message sending logic
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
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
                {/* Patient List */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Patients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patients.length === 0 ? (
                      <div className="text-center py-4">
                        <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No patients assigned</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {patients.map((patient) => (
                          <div
                            key={patient.id}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedPatient === patient.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedPatient(patient.id)}
                          >
                            <div className="font-medium">
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div className="text-sm text-gray-600">{patient.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chat Interface */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Patient Consultation</CardTitle>
                  </CardHeader>
                  <CardContent className="h-96 flex flex-col">
                    {selectedPatient ? (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                              Start a conversation with your patient
                            </div>
                          ) : (
                            messages.map((message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.sender_type === 'physician' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                    message.sender_type === 'physician'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message to the patient..."
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Select a patient to start chatting</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="physicians" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Physician List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Other Physicians</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {physicians.length === 0 ? (
                      <div className="text-center py-4">
                        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No other physicians available</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {physicians.map((physician) => (
                          <div
                            key={physician.id}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                              selectedPhysician === physician.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedPhysician(physician.id)}
                          >
                            <div className="font-medium">
                              Dr. {physician.first_name} {physician.last_name}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {physician.specialization}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Physician Chat */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Physician Consultation</CardTitle>
                  </CardHeader>
                  <CardContent className="h-96 flex flex-col">
                    {selectedPhysician ? (
                      <>
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                          <div className="text-center text-gray-500 mt-8">
                            Start a professional discussion
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message to colleague..."
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Select a physician to start consulting</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
