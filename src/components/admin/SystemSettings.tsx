
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, newValue: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setSettings(prev => prev.map(setting => 
        setting.setting_key === settingKey 
          ? { ...setting, setting_value: newValue }
          : setting
      ));

      toast({
        title: "Settings Updated",
        description: `${settingKey} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.map((setting) => (
            <div key={setting.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h4>
                <Badge variant="outline">System</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
              
              {setting.setting_key === 'platform_maintenance_mode' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.setting_value.enabled || false}
                      onCheckedChange={(checked) => 
                        updateSetting(setting.setting_key, {
                          ...setting.setting_value,
                          enabled: checked
                        })
                      }
                      disabled={saving}
                    />
                    <span>Maintenance Mode</span>
                    {setting.setting_value.enabled && (
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <Input
                    placeholder="Maintenance message"
                    value={setting.setting_value.message || ''}
                    onChange={(e) => 
                      updateSetting(setting.setting_key, {
                        ...setting.setting_value,
                        message: e.target.value
                      })
                    }
                    disabled={saving}
                  />
                </div>
              )}

              {setting.setting_key === 'user_registration_enabled' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={setting.setting_value.enabled || false}
                    onCheckedChange={(checked) => 
                      updateSetting(setting.setting_key, {
                        ...setting.setting_value,
                        enabled: checked
                      })
                    }
                    disabled={saving}
                  />
                  <span>Allow New User Registration</span>
                </div>
              )}

              {setting.setting_key === 'emergency_alert_enabled' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={setting.setting_value.enabled || false}
                      onCheckedChange={(checked) => 
                        updateSetting(setting.setting_key, {
                          ...setting.setting_value,
                          enabled: checked
                        })
                      }
                      disabled={saving}
                    />
                    <span>Emergency Alert System</span>
                    <Shield className="w-4 h-4 text-red-500" />
                  </div>
                  <Input
                    placeholder="Emergency alert message"
                    value={setting.setting_value.alert_message || ''}
                    onChange={(e) => 
                      updateSetting(setting.setting_key, {
                        ...setting.setting_value,
                        alert_message: e.target.value
                      })
                    }
                    disabled={saving}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
