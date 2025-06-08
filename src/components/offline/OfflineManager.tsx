
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Wifi, WifiOff, Download, RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CachedData {
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
  const [cachedData, setCachedData] = useState<CachedData[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (user) {
      fetchCachedData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const fetchCachedData = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_cache')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCachedData(data || []);
    } catch (error) {
      console.error('Error fetching cached data:', error);
    }
  };

  const downloadForOffline = async () => {
    setSyncing(true);
    setDownloadProgress(0);

    try {
      const dataTypes = [
        'emergency_contacts',
        'health_records', 
        'prescriptions',
        'appointments',
        'user_preferences'
      ];

      for (let i = 0; i < dataTypes.length; i++) {
        const dataType = dataTypes[i];
        setDownloadProgress(((i + 1) / dataTypes.length) * 100);

        // Fetch data based on type
        let data;
        switch (dataType) {
          case 'emergency_contacts':
            const { data: contacts } = await supabase
              .from('emergency_contacts')
              .select('*')
              .eq('patient_id', user?.id);
            data = contacts;
            break;
          case 'health_records':
            const { data: records } = await supabase
              .from('health_records')
              .select('*')
              .eq('patient_id', user?.id)
              .limit(50);
            data = records;
            break;
          case 'prescriptions':
            const { data: prescriptions } = await supabase
              .from('prescriptions')
              .select('*')
              .eq('patient_id', user?.id)
              .limit(20);
            data = prescriptions;
            break;
          case 'appointments':
            const { data: appointments } = await supabase
              .from('appointments')
              .select('*')
              .eq('patient_id', user?.id)
              .gte('appointment_date', new Date().toISOString().split('T')[0])
              .limit(10);
            data = appointments;
            break;
          case 'user_preferences':
            const { data: prefs } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', user?.id)
              .single();
            data = prefs;
            break;
        }

        if (data) {
          // Cache the data
          await supabase
            .from('offline_cache')
            .upsert({
              user_id: user?.id,
              data_type: dataType,
              cache_key: `${dataType}_${user?.id}`,
              cached_data: data,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            });
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "Download Complete",
        description: "Your data has been cached for offline access."
      });

      fetchCachedData();
    } catch (error) {
      console.error('Error downloading for offline:', error);
      toast({
        title: "Download Failed",
        description: "Failed to cache data for offline access.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
      setDownloadProgress(0);
    }
  };

  const clearCache = async () => {
    try {
      const { error } = await supabase
        .from('offline_cache')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Cache Cleared",
        description: "All offline data has been removed."
      });

      setCachedData([]);
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache.",
        variant: "destructive"
      });
    }
  };

  const formatDataType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getCacheSize = () => {
    const totalSize = cachedData.reduce((acc, item) => {
      return acc + JSON.stringify(item.cached_data).length;
    }, 0);
    return (totalSize / 1024).toFixed(2); // Size in KB
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Offline Access
          </div>
          <Badge className={isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              You're currently offline. You can still access your cached data below.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Download for Offline Access</h3>
              <p className="text-sm text-gray-600">
                Cache your essential health data for offline viewing
              </p>
            </div>
            <Button 
              onClick={downloadForOffline} 
              disabled={syncing || !isOnline}
              className="flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
          </div>

          {syncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Downloading data...</span>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
              <Progress value={downloadProgress} />
            </div>
          )}
        </div>

        {cachedData.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Cached Data</h3>
                <p className="text-sm text-gray-600">
                  Total size: {getCacheSize()} KB
                </p>
              </div>
              <Button variant="outline" onClick={clearCache}>
                Clear Cache
              </Button>
            </div>

            <div className="space-y-2">
              {cachedData.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <span className="font-medium">{formatDataType(item.data_type)}</span>
                    <p className="text-sm text-gray-600">
                      Cached: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpired(item.expires_at) ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Valid
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
