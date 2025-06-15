
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, FileCheck, Activity, CheckCircle, XCircle, AlertTriangle, Settings, Siren, DollarSign, FileText, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SystemSettings } from './SystemSettings';
import { AdminAuditLog } from './AdminAuditLog';
import { EmergencyManagement } from './EmergencyManagement';
import { RealTimeMonitoring } from './RealTimeMonitoring';
import { UserActivityMonitor } from './UserActivityMonitor';
import { FinancialDisputes } from './FinancialDisputes';
import { ComplianceReports } from './ComplianceReports';

interface VerificationRequest {
  id: string;
  user_id: string;
  request_type: string;
  verification_type: string;
  status: string;
  submitted_at: string;
  document_urls: string[];
  notes: string;
  priority: number;
  user_email: string;
  user_name: string;
}

interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  hospital_name?: string;
}

export const EnhancedAdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_users: 0,
    pending_verifications: 0,
    active_hospitals: 0,
    active_physicians: 0,
    emergency_alerts: 0,
    system_health: 95,
    pending_disputes: 0,
    total_activities_today: 0
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminData();
    }
  }, [profile]);

  const fetchAdminData = async () => {
    try {
      // Fetch verification requests with proper joins
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles (
            email,
            first_name,
            last_name
          )
        `)
        .order('priority', { ascending: false })
        .order('submitted_at', { ascending: false });

      if (verificationError) {
        console.error('Verification error:', verificationError);
        throw verificationError;
      }

      const formattedVerificationRequests = verificationData?.map((req: any) => ({
        ...req,
        user_email: req.profiles?.email || '',
        user_name: `${req.profiles?.first_name || ''} ${req.profiles?.last_name || ''}`.trim()
      })) || [];

      setVerificationRequests(formattedVerificationRequests);

      // Fetch system users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          hospitals (name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const formattedUsers = usersData?.map((user: any) => ({
        ...user,
        hospital_name: user.hospitals?.name || null
      })) || [];

      setSystemUsers(formattedUsers);

      // Fetch emergency alerts count
      const { count: emergencyCount } = await supabase
        .from('emergency_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch financial disputes count
      const { count: disputesCount } = await supabase
        .from('financial_disputes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch today's activities count
      const today = new Date().toISOString().split('T')[0];
      const { count: activitiesCount } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Calculate stats
      setStats({
        total_users: usersData?.length || 0,
        pending_verifications: formattedVerificationRequests.filter(req => req.status === 'pending').length,
        active_hospitals: usersData?.filter(user => user.role === 'hospital_admin' && user.is_active).length || 0,
        active_physicians: usersData?.filter(user => user.role === 'physician' && user.is_active).length || 0,
        emergency_alerts: emergencyCount || 0,
        system_health: 95, // Mock system health percentage
        pending_disputes: disputesCount || 0,
        total_activities_today: activitiesCount || 0
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
          notes: notes || ''
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: 'user_verification',
        target_resource_type_param: 'verification_request',
        target_resource_id_param: requestId,
        action_details_param: { action, notes }
      });

      // Update local state
      setVerificationRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
          : req
      ));

      toast({
        title: "Action Completed",
        description: `Verification request has been ${action}d.`,
      });

      // If approving, activate their account
      if (action === 'approve') {
        const request = verificationRequests.find(req => req.id === requestId);
        if (request && (request.verification_type === 'hospital' || request.verification_type === 'physician')) {
          await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('id', request.user_id);
        }
      }

    } catch (error) {
      console.error('Error processing verification:', error);
      toast({
        title: "Error",
        description: "Failed to process verification request.",
        variant: "destructive"
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.rpc('log_admin_action', {
        action_type_param: currentStatus ? 'user_suspension' : 'user_activation',
        target_user_id_param: userId,
        target_resource_type_param: 'user_profile',
        action_details_param: { new_status: !currentStatus }
      });

      setSystemUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ));

      toast({
        title: "Status Updated",
        description: `User has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_verifications}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Hospitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_hospitals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Physicians</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active_physicians}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Emergency Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.emergency_alerts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.system_health}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.pending_disputes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Activities Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.total_activities_today}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Dashboard */}
      <Tabs defaultValue="verifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="verifications">
            Verifications ({stats.pending_verifications})
          </TabsTrigger>
          <TabsTrigger value="users">System Users</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="verifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Verification Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {verificationRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No verification requests found</p>
              ) : (
                <div className="space-y-4">
                  {verificationRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{request.user_name}</p>
                          <p className="text-sm text-gray-600">{request.user_email}</p>
                          <p className="text-xs text-gray-500">
                            {request.verification_type} verification • Priority {request.priority}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'approved' ? 'default' : 'destructive'
                            }
                          >
                            {request.status}
                          </Badge>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleVerificationAction(request.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerificationAction(request.id, 'reject')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {request.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          Notes: {request.notes}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(request.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                System Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{user.role}</Badge>
                        {user.hospital_name && (
                          <Badge variant="secondary">{user.hospital_name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <RealTimeMonitoring />
        </TabsContent>

        <TabsContent value="activity">
          <UserActivityMonitor />
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyManagement />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialDisputes />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceReports />
        </TabsContent>

        <TabsContent value="settings">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};
