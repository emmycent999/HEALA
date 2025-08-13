
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Key, Database, Security, Globe, Mail, Bell } from 'lucide-react';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  category: string;
  description: string;
  is_active: boolean;
}

export const AdminSystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
      
      // Extract AI API key settings
      const aiSetting = data?.find(s => s.setting_key === 'ai_api_key');
      if (aiSetting) {
        setAiApiKey(aiSetting.setting_value.key || '');
        setAiProvider(aiSetting.setting_value.provider || 'openai');
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive"
      });
    }
  };

  const saveAiApiKey = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'ai_api_key',
          setting_value: { key: aiApiKey, provider: aiProvider },
          category: 'ai',
          description: 'AI API key configuration'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI API key has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving AI API key:', error);
      toast({
        title: "Error",
        description: "Failed to save AI API key.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingKey: string, value: any) => {
    try {
      const setting = settings.find(s => s.setting_key === settingKey);
      if (!setting) return;

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setSettings(prev => prev.map(s => 
        s.setting_key === settingKey 
          ? { ...s, setting_value: value }
          : s
      ));

      toast({
        title: "Setting Updated",
        description: `${settingKey} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive"
      });
    }
  };

  const createNewSetting = async (key: string, value: any, category: string, description: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .insert({
          setting_key: key,
          setting_value: value,
          category: category,
          description: description
        });

      if (error) throw error;

      fetchSystemSettings();
      toast({
        title: "Setting Created",
        description: `New setting ${key} has been created.`,
      });
    } catch (error) {
      console.error('Error creating setting:', error);
      toast({
        title: "Error",
        description: "Failed to create setting.",
        variant: "destructive"
      });
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-bold">System Settings</h2>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            AI API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="aiProvider">AI Provider</Label>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="claude">Anthropic Claude</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="aiApiKey">API Key</Label>
            <Input
              id="aiApiKey"
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="Enter your AI API key"
            />
          </div>
          <Button onClick={saveAiApiKey} disabled={loading}>
            {loading ? 'Saving...' : 'Save AI API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Security className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication Required</Label>
                <p className="text-sm text-gray-600">Require 2FA for all admin users</p>
              </div>
              <Switch
                checked={getSettingsByCategory('security').find(s => s.setting_key === 'require_2fa')?.setting_value || false}
                onCheckedChange={(checked) => updateSetting('require_2fa', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout (minutes)</Label>
                <p className="text-sm text-gray-600">Auto-logout inactive users</p>
              </div>
              <Input
                type="number"
                className="w-24"
                value={getSettingsByCategory('security').find(s => s.setting_key === 'session_timeout')?.setting_value || 60}
                onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              value={getSettingsByCategory('email').find(s => s.setting_key === 'smtp_host')?.setting_value || ''}
              onChange={(e) => updateSetting('smtp_host', e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <Label htmlFor="smtpPort">SMTP Port</Label>
            <Input
              id="smtpPort"
              type="number"
              value={getSettingsByCategory('email').find(s => s.setting_key === 'smtp_port')?.setting_value || 587}
              onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Enable Email Notifications</Label>
            <Switch
              checked={getSettingsByCategory('email').find(s => s.setting_key === 'email_enabled')?.setting_value || true}
              onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            System Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="systemName">System Name</Label>
            <Input
              id="systemName"
              value={getSettingsByCategory('general').find(s => s.setting_key === 'system_name')?.setting_value || 'Heala'}
              onChange={(e) => updateSetting('system_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            <Switch
              checked={getSettingsByCategory('general').find(s => s.setting_key === 'maintenance_mode')?.setting_value || false}
              onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
            />
          </div>
          <div>
            <Label htmlFor="maxFileSize">Max File Upload Size (MB)</Label>
            <Input
              id="maxFileSize"
              type="number"
              value={getSettingsByCategory('general').find(s => s.setting_key === 'max_file_size')?.setting_value || 10}
              onChange={(e) => updateSetting('max_file_size', parseInt(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Emergency Alerts</Label>
              <p className="text-sm text-gray-600">Send immediate alerts for emergencies</p>
            </div>
            <Switch
              checked={getSettingsByCategory('notifications').find(s => s.setting_key === 'emergency_alerts')?.setting_value !== false}
              onCheckedChange={(checked) => updateSetting('emergency_alerts', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Admin Notifications</Label>
              <p className="text-sm text-gray-600">Send notifications to admin users</p>
            </div>
            <Switch
              checked={getSettingsByCategory('notifications').find(s => s.setting_key === 'admin_notifications')?.setting_value !== false}
              onCheckedChange={(checked) => updateSetting('admin_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
