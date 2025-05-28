
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, FileText, User, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationItem {
  id: string;
  type: 'physician' | 'agent' | 'hospital';
  name: string;
  email: string;
  status: string;
  submittedAt: string;
  details: any;
}

export const VerificationCenter: React.FC = () => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      // Fetch physician registrations
      const { data: physicians, error: physError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'physician')
        .eq('is_active', false);

      // Fetch agent registrations
      const { data: agents, error: agentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .eq('is_active', false);

      // Fetch hospital registrations
      const { data: hospitals, error: hospError } = await supabase
        .from('hospitals')
        .select('*')
        .eq('is_active', false);

      if (physError || agentError || hospError) {
        throw new Error('Failed to fetch verifications');
      }

      const allVerifications: VerificationItem[] = [
        ...(physicians || []).map(p => ({
          id: p.id,
          type: 'physician' as const,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          status: 'pending',
          submittedAt: p.created_at,
          details: p
        })),
        ...(agents || []).map(a => ({
          id: a.id,
          type: 'agent' as const,
          name: `${a.first_name} ${a.last_name}`,
          email: a.email,
          status: 'pending',
          submittedAt: a.created_at,
          details: a
        })),
        ...(hospitals || []).map(h => ({
          id: h.id,
          type: 'hospital' as const,
          name: h.name,
          email: h.email,
          status: 'pending',
          submittedAt: h.created_at,
          details: h
        }))
      ];

      setVerifications(allVerifications);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast({
        title: "Error",
        description: "Failed to load verification requests.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (item: VerificationItem, approved: boolean) => {
    try {
      if (item.type === 'hospital') {
        const { error } = await supabase
          .from('hospitals')
          .update({ is_active: approved })
          .eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: approved })
          .eq('id', item.id);
        if (error) throw error;
      }

      toast({
        title: approved ? "Approved" : "Rejected",
        description: `${item.name} has been ${approved ? 'approved' : 'rejected'}.`,
      });

      fetchVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status.",
        variant: "destructive"
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'physician': return <User className="w-5 h-5" />;
      case 'agent': return <User className="w-5 h-5" />;
      case 'hospital': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'physician': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      case 'hospital': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading verification requests...</div>
        </CardContent>
      </Card>
    );
  }

  const physicianVerifications = verifications.filter(v => v.type === 'physician');
  const agentVerifications = verifications.filter(v => v.type === 'agent');
  const hospitalVerifications = verifications.filter(v => v.type === 'hospital');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Center</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({verifications.length})</TabsTrigger>
            <TabsTrigger value="physicians">Physicians ({physicianVerifications.length})</TabsTrigger>
            <TabsTrigger value="agents">Agents ({agentVerifications.length})</TabsTrigger>
            <TabsTrigger value="hospitals">Hospitals ({hospitalVerifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {verifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending verifications</p>
              </div>
            ) : (
              verifications.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getIcon(item.type)}
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.email}</p>
                      </div>
                    </div>
                    <Badge className={getTypeColor(item.type)}>
                      {item.type}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="font-medium">Submitted: </span>
                      <span className="text-gray-600">
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {item.type === 'physician' && item.details.specialization && (
                      <div>
                        <span className="font-medium">Specialization: </span>
                        <span className="text-gray-600">{item.details.specialization}</span>
                      </div>
                    )}
                    {item.type === 'physician' && item.details.license_number && (
                      <div>
                        <span className="font-medium">License: </span>
                        <span className="text-gray-600">{item.details.license_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerification(item, true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleVerification(item, false)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="physicians" className="space-y-4">
            {physicianVerifications.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                {/* Same content structure as above */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Physician</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleVerification(item, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerification(item, false)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            {agentVerifications.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Agent</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleVerification(item, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerification(item, false)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="hospitals" className="space-y-4">
            {hospitalVerifications.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Hospital</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleVerification(item, true)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleVerification(item, false)}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
