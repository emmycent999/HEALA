
import React, { useEffect, useState } from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatHeaderSectionProps {
  onBack: () => void;
  conversationId?: string;
}

interface PhysicianInfo {
  first_name: string;
  last_name: string;
  specialization: string;
}

export const ChatHeaderSection: React.FC<ChatHeaderSectionProps> = ({ onBack, conversationId }) => {
  const { user, profile } = useAuth();
  const [physicianInfo, setPhysicianInfo] = useState<PhysicianInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhysicianInfo = async () => {
      if (!conversationId || !user) return;

      try {
        // Get conversation details to find the physician
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select('physician_id, patient_id')
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;

        // Determine which user is the physician
        const physicianId = profile?.role === 'patient' 
          ? conversation.physician_id 
          : conversation.patient_id;

        if (physicianId) {
          // Fetch physician profile
          const { data: physicianData, error: physicianError } = await supabase
            .from('profiles')
            .select('first_name, last_name, specialization')
            .eq('id', physicianId)
            .single();

          if (physicianError) throw physicianError;

          setPhysicianInfo(physicianData);
        }
      } catch (error) {
        console.error('Error fetching physician info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhysicianInfo();
  }, [conversationId, user, profile]);

  const getDisplayName = () => {
    if (loading) return 'Loading...';
    
    if (physicianInfo) {
      const fullName = `${physicianInfo.first_name || ''} ${physicianInfo.last_name || ''}`.trim();
      return profile?.role === 'patient' 
        ? `Dr. ${fullName}` 
        : fullName;
    }
    
    return profile?.role === 'patient' ? 'Physician' : 'Patient';
  };

  const getSpecialization = () => {
    if (loading || !physicianInfo) return '';
    return profile?.role === 'patient' ? physicianInfo.specialization : 'Patient';
  };

  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">{getDisplayName()}</CardTitle>
            {getSpecialization() && (
              <p className="text-sm text-gray-600">{getSpecialization()}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
  );
};
