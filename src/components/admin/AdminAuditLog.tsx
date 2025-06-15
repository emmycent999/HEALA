
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Search, Filter, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id: string | null;
  target_resource_type: string | null;
  target_resource_id: string | null;
  action_details: any;
  ip_address: string | null;
  created_at: string;
  admin: {
    first_name: string;
    last_name: string;
    email: string;
  };
  target_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const AdminAuditLog: React.FC = () => {
  const { toast } = useToast();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');

  useEffect(() => {
    // Mock audit log data since the table doesn't exist in types yet
    const mockActions: AdminAction[] = [
      {
        id: '1',
        admin_id: 'admin1',
        action_type: 'user_verification',
        target_user_id: 'user1',
        target_resource_type: 'verification_request',
        target_resource_id: 'req1',
        action_details: { action: 'approved' },
        ip_address: '192.168.1.1',
        created_at: new Date().toISOString(),
        admin: {
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@example.com'
        },
        target_user: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      },
      {
        id: '2',
        admin_id: 'admin1',
        action_type: 'system_setting_update',
        target_user_id: null,
        target_resource_type: 'system_setting',
        target_resource_id: 'setting1',
        action_details: { setting: 'maintenance_mode', value: false },
        ip_address: '192.168.1.1',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        admin: {
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@example.com'
        }
      }
    ];
    
    setActions(mockActions);
    setLoading(false);
  }, []);

  const filteredActions = actions.filter(action => {
    const matchesSearch = searchTerm === '' || 
      action.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.target_user?.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = actionTypeFilter === 'all' || action.action_type === actionTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'user_verification': return 'bg-green-100 text-green-800';
      case 'user_suspension': return 'bg-red-100 text-red-800';
      case 'user_activation': return 'bg-blue-100 text-blue-800';
      case 'system_setting_update': return 'bg-purple-100 text-purple-800';
      case 'emergency_override': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading audit log...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Admin Audit Log
        </CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search actions, admin, or target user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_verification">User Verification</SelectItem>
              <SelectItem value="user_suspension">User Suspension</SelectItem>
              <SelectItem value="user_activation">User Activation</SelectItem>
              <SelectItem value="system_setting_update">System Updates</SelectItem>
              <SelectItem value="emergency_override">Emergency Override</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No audit log entries found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((action) => (
              <div key={action.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getActionTypeColor(action.action_type)}>
                      {action.action_type.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(action.created_at).toLocaleString()}
                    </span>
                  </div>
                  {action.ip_address && (
                    <span className="text-xs text-gray-400">IP: {action.ip_address}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      Admin: <strong>{action.admin.first_name} {action.admin.last_name}</strong> ({action.admin.email})
                    </span>
                  </div>
                  
                  {action.target_user && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        Target: <strong>{action.target_user.first_name} {action.target_user.last_name}</strong> ({action.target_user.email})
                      </span>
                    </div>
                  )}
                  
                  {action.action_details && Object.keys(action.action_details).length > 0 && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      <strong>Details:</strong> {JSON.stringify(action.action_details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
