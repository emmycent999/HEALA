
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, Download, Trash2, HardDrive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CacheData {
  id: string;
  data_type: string;
  cache_key: string;
  cached_data: any;
  expires_at: string;
  created_at: string;
}

export const OfflineManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineEnabled, setOfflineEnabled] = useState(true);
  const [cacheData, setCacheData] = useState<CacheData[]>([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (user) {
      fetchCacheData();
      calculateStorageUsed();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const fetchCacheData = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_cache' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCacheData(data || []);
    } catch (error) {
      console.error('Error fetching cache data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStorageUsed = () => {
    // Simulate storage calculation
    const used = Math.floor(Math.random() * 50) + 10; // 10-60 MB
    setStorageUsed(used);
  };

  const downloadForOfflineAccess = async () => {
    setDownloading(true);
    try {
      // Download essential data for offline access
      const dataTypes = ['appointments', 'prescriptions', 'emergency_contacts', 'health_records'];
      
      for (const dataType of dataTypes) {
        let data = [];
        
        switch (dataType) {
          case 'appointments':
            const { data: appointments } = await supabase
              .from('appointments')
              .select('*')
              .eq('patient_id', user?.id)
              .gte('appointment_date', new Date().toISOString().split('T')[0]);
            data = appointments || [];
            break;
            
          case 'prescriptions':
            const { data: prescriptions } = await supabase
              .from('prescriptions' as any)
              .select('*')
              .eq('patient_id', user?.id)
              .in('status', ['pending', 'approved', 'dispensed']);
            data = prescriptions || [];
            break;
            
          case 'emergency_contacts':
            const { data: contacts } = await supabase
              .from('emergency_contacts' as any)
              .select('*')
              .eq('patient_id', user?.id);
            data = contacts || [];
            break;
            
          case 'health_records':
            const { data: records } = await supabase
              .from('health_records' as any)
              .select('*')
              .eq('patient_id', user?.id)
              .limit(50);
            data = records || [];
            break;
        }

        // Cache the data
        await supabase
          .from('offline_cache' as any)
          .upsert({
            user_id: user?.id,
            data_type: dataType,
            cache_key: `${dataType}_${user?.id}`,
            cached_data: data,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          });
      }

      toast({
        title: "Download Complete",
        description: "Essential data has been cached for offline access."
      });

      fetchCacheData();
      calculateStorageUsed();
    } catch (error) {
      console.error('Error downloading offline data:', error);
      toast({
        title: "Download Failed",
        description: "Failed to cache data for offline access.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const clearCache = async (dataType?: string) => {
    try {
      let query = supabase
        .from('offline_cache' as any)
        .delete()
        .eq('user_id', user?.id);

      if (dataType) {
        query = query.eq('data_type', dataType);
      }

      const { error } = await query;
      if (error) throw error;

      toast({
        title: "Cache Cleared",
        description: dataType 
          ? `${dataType} cache cleared successfully.`
          : "All cached data cleared successfully."
      });

      fetchCacheData();
      calculateStorageUsed();
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive"
      });
    }
  };

  const getDataTypeLabel = (dataType: string) => {
    const labels: { [key: string]: string } = {
      appointments: 'Appointments',
      prescriptions: 'Prescriptions',
      emergency_contacts: 'Emergency Contacts',
      health_records: 'Health Records'
    };
    return labels[dataType] || dataType;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading offline settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            Offline Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="offline-enabled">Enable Offline Access</Label>
              <p className="text-sm text-gray-600">
                Download essential data for offline viewing
              </p>
            </div>
            <Switch
              id="offline-enabled"
              checked={offlineEnabled}
              onCheckedChange={setOfflineEnabled}
            />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Connection Status</span>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {offlineEnabled && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Download Data</h3>
                    <p className="text-sm text-gray-600">
                      Download your latest data for offline access
                    </p>
                  </div>
                  <Button
                    onClick={downloadForOfflineAccess}
                    disabled={downloading}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Storage Usage</h3>
                  </div>
                  <span className="text-sm text-gray-600">{storageUsed} MB used</span>
                </div>
                <Progress value={(storageUsed / 100) * 100} className="w-full" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cached Data</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCache()}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </Button>
                </div>

                {cacheData.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    No cached data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cacheData.map((cache) => (
                      <div key={cache.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{getDataTypeLabel(cache.data_type)}</h4>
                          <p className="text-sm text-gray-600">
                            Cached: {new Date(cache.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearCache(cache.data_type)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
