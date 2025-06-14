
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Video, Plus } from 'lucide-react';

export const TestVideoSession: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const createTestVideoSession = async () => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a test session.",
          variant: "destructive"
        });
        return;
      }

      // Create a test appointment first
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile?.role === 'physician' ? '150176f3-659d-4421-8e11-81086e3b5d00' : user.id,
          physician_id: profile?.role === 'physician' ? user.id : 'c48a9b68-2144-4767-a3d1-395fab939a50',
          appointment_date: new Date().toISOString().split('T')[0],
          appointment_time: '14:00',
          consultation_type: 'virtual',
          status: 'accepted',
          notes: 'Test video consultation session'
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Create a video consultation session
      const { data: sessionData, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          appointment_id: appointmentData.id,
          patient_id: profile?.role === 'physician' ? '150176f3-659d-4421-8e11-81086e3b5d00' : user.id,
          physician_id: profile?.role === 'physician' ? user.id : 'c48a9b68-2144-4767-a3d1-395fab939a50',
          consultation_rate: 5000,
          session_type: 'video', // This is the key change - making it video type
          status: 'scheduled',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast({
        title: "Test Session Created",
        description: `Video consultation session created with ID: ${sessionData.id}. Refresh the page to see it in the list.`,
      });

      // Refresh the page to see the new session
      window.location.reload();
      
    } catch (error) {
      console.error('Error creating test session:', error);
      toast({
        title: "Error",
        description: "Failed to create test session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Test Video Session
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Create a test video consultation session to see the new UI changes.
        </p>
        <Button onClick={createTestVideoSession} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Test Video Session
        </Button>
      </CardContent>
    </Card>
  );
};
