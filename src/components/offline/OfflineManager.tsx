import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CacheData {
  id: string;
  data_type: string;
  cache_key: string;
  cached_data: any;
  last_updated: string;
  user_id: string;
}

export const OfflineManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<CacheData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    fetchCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchCachedData = async () => {
    try {
      const { data, error } = await supabase
        .from('offline_cache' as any)
        .select('*')
        .eq('user_id', user?.id)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      
      // Validate data structure
      const validCacheData = (data || []).filter((item: any) => 
        item && typeof item === 'object' && 'id' in item
      ).map((item: any) => ({
        id: item.id,
        data_type: item.data_type,
        cache_key: item.cache_key,
        cached_data: item.cached_data,
        last_updated: item.last_updated,
        user_id: item.user_id
      }));
      
      setCachedData(validCacheData as CacheData[]);
    } catch (error) {
      console.error('Error fetching cached data:', error);
    }
  };

  const cacheEssentialData = async () => {
    setLoading(true);
    try {
      // Cache recent appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user?.id)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .limit(10);

      if (appointments) {
        await supabase
          .from('offline_cache' as any)
          .upsert({
            user_id: user?.id,
            data_type: 'appointments',
            cache_key: 'recent_appointments',
            cached_data: appointments,
            last_updated: new Date().toISOString()
          });
      }

      // Cache emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts' as any)
        .select('*')
        .eq('patient_id', user?.id);

      if (contacts) {
        await supabase
          .from('offline_cache' as any)
          .upsert({
            user_id: user?.id,
            data_type: 'emergency_contacts',
            cache_key: 'emergency_contacts',
            cached_data: contacts,
            last_updated: new Date().toISOString()
          });
      }

      toast({
        title: "Data Cached",
        description: "Essential data has been cached for offline access."
      });

      fetchCachedData();
    } catch (error) {
      console.error('Error caching data:', error);
      toast({
        title: "Cache Error",
        description: "Failed to cache data for offline access.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      const { error } = await supabase
        .from('offline_cache' as any)
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Cache Cleared",
        description: "All cached data has been removed."
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            Offline Access
          </CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={cacheEssentialData}
            disabled={loading || !isOnline}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? 'Caching...' : 'Cache Essential Data'}
          </Button>
          <Button
            variant="outline"
            onClick={clearCache}
            disabled={cachedData.length === 0}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Cache
          </Button>
        </div>

        {cachedData.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Cached Data</h4>
            {cachedData.map((cache) => (
              <div key={cache.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{cache.data_type}</span>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(cache.last_updated).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">{cache.cache_key}</Badge>
              </div>
            ))}
          </div>
        )}

        {!isOnline && cachedData.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No cached data available for offline access
          </div>
        )}
      </CardContent>
    </Card>
  );
};
