
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Shield, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface HealthRecord {
  id: string;
  record_type: 'test_result' | 'diagnosis' | 'prescription' | 'vaccination' | 'allergy' | 'procedure';
  title: string;
  description?: string;
  record_data?: any;
  document_url?: string;
  recorded_date: string;
  is_sensitive: boolean;
  recorded_by?: string;
  created_at: string;
}

export const HealthRecordsAccess: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchHealthRecords();
    }
  }, [user]);

  const fetchHealthRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('patient_id', user?.id)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching health records:', error);
      toast({
        title: "Error",
        description: "Failed to load health records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'test_result': return 'bg-blue-100 text-blue-800';
      case 'diagnosis': return 'bg-red-100 text-red-800';
      case 'prescription': return 'bg-green-100 text-green-800';
      case 'vaccination': return 'bg-purple-100 text-purple-800';
      case 'allergy': return 'bg-orange-100 text-orange-800';
      case 'procedure': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = selectedType === 'all' 
    ? records 
    : records.filter(record => record.record_type === selectedType);

  const recordTypes = [
    { value: 'all', label: 'All Records' },
    { value: 'test_result', label: 'Test Results' },
    { value: 'diagnosis', label: 'Diagnoses' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'allergy', label: 'Allergies' },
    { value: 'procedure', label: 'Procedures' }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading health records...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Health Records
            <Shield className="w-4 h-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              {recordTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value} className="text-xs">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-6">
              {filteredRecords.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  {selectedType === 'all' 
                    ? 'No health records found'
                    : `No ${recordTypes.find(t => t.value === selectedType)?.label.toLowerCase()} found`
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{record.title}</h4>
                            {record.is_sensitive && (
                              <Shield className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <Badge className={getRecordTypeColor(record.record_type)}>
                            {record.record_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.recorded_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {record.description && (
                        <p className="text-gray-600 mb-3">{record.description}</p>
                      )}

                      {record.record_data && (
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <pre className="text-sm whitespace-pre-wrap">
                            {JSON.stringify(record.record_data, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {record.recorded_by && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              Recorded by healthcare provider
                            </div>
                          )}
                        </div>
                        
                        {record.document_url && (
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
