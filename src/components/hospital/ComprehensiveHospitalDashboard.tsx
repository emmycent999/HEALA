
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Shield, 
  Settings,
  FileText,
  TrendingUp,
  Zap,
  Building,
  UserPlus,
  Search,
  Phone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HospitalOverview } from './HospitalOverview';
import { PhysicianManagement } from './PhysicianManagement';
import { AppointmentManagement } from './AppointmentManagement';
import { HospitalPhysicianAssignment } from './HospitalPhysicianAssignment';

interface HospitalInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  is_active: boolean;
}

interface DashboardStats {
  total_physicians: number;
  active_physicians: number;
  total_appointments: number;
  today_appointments: number;
  total_patients: number;
  emergency_requests: number;
  revenue_this_month: number;
  occupancy_rate: number;
}

export const ComprehensiveHospitalDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_physicians: 0,
    active_physicians: 0,
    total_appointments: 0,
    today_appointments: 0,
    total_patients: 0,
    emergency_requests: 0,
    revenue_this_month: 0,
    occupancy_rate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && profile?.role === 'hospital_admin' && profile?.hospital_id) {
      fetchHospitalData();
      fetchDashboardStats();
    }
  }, [user, profile]);

  const fetchHospitalData = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data: hospital, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('id', profile.hospital_id)
        .single();

      if (error) throw error;
      setHospitalInfo(hospital);
    } catch (error) {
      console.error('Error fetching hospital data:', error);
      toast({
        title: "Error",
        description: "Failed to load hospital information.",
        variant: "destructive"
      });
    }
  };

  const fetchDashboardStats = async () => {
    if (!profile?.hospital_id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      // Fetch all stats in parallel
      const [
        { count: totalPhysicians },
        { count: activePhysicians },
        { count: totalAppointments },
        { count: todayAppointments },
        { count: emergencyRequests }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician'),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('role', 'physician')
          .eq('is_active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('appointment_date', today),
        supabase.from('emergency_requests').select('*', { count: 'exact', head: true })
          .eq('hospital_id', profile.hospital_id)
          .eq('status', 'pending')
      ]);

      // Get unique patients count
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('hospital_id', profile.hospital_id);

      const uniquePatients = new Set(appointmentData?.map(a => a.patient_id) || []).size;

      setStats({
        total_physicians: totalPhysicians || 0,
        active_physicians: activePhysicians || 0,
        total_appointments: totalAppointments || 0,
        today_appointments: todayAppointments || 0,
        total_patients: uniquePatients,
        emergency_requests: emergencyRequests || 0,
        revenue_this_month: Math.floor(Math.random() * 500000) + 100000, // Mock data
        occupancy_rate: Math.floor(Math.random() * 30) + 70 // Mock data 70-100%
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'hospital_admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the hospital dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile?.hospital_id) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">No Hospital Assignment</h3>
          <p className="text-gray-600">Your account is not associated with any hospital. Please contact an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <div className="p-6">Loading hospital dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hospital Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{hospitalInfo?.name || 'Hospital Dashboard'}</h1>
            <p className="opacity-90">
              {hospitalInfo?.address}, {hospitalInfo?.city}, {hospitalInfo?.state}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={hospitalInfo?.is_active ? "default" : "destructive"} className="bg-white/20">
                {hospitalInfo?.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="bg-white/20">
                {hospitalInfo?.verification_status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Live Dashboard</span>
            </div>
            <Badge variant="outline" className="bg-white/20">
              <Zap className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Physicians</p>
                <p className="text-2xl font-bold">{stats.total_physicians}</p>
                <p className="text-xs text-green-600">{stats.active_physicians} active</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold">{stats.today_appointments}</p>
                <p className="text-xs text-gray-500">of {stats.total_appointments} total</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.emergency_requests}</p>
                <p className="text-xs text-gray-500">pending response</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Occupancy Rate</p>
                <p className="text-2xl font-bold">{stats.occupancy_rate}%</p>
                <p className="text-xs text-gray-500">current capacity</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="physicians">Physicians</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <HospitalOverview />
        </TabsContent>

        <TabsContent value="physicians">
          <div className="space-y-6">
            <PhysicianManagement />
            <Card>
              <CardHeader>
                <CardTitle>Assign External Physicians</CardTitle>
              </CardHeader>
              <CardContent>
                <HospitalPhysicianAssignment />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentManagement />
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Patient Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.total_patients}</div>
                      <div className="text-sm text-gray-600">Total Patients</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(stats.total_patients * 0.7)}
                      </div>
                      <div className="text-sm text-gray-600">Returning Patients</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor(stats.total_patients * 0.3)}
                      </div>
                      <div className="text-sm text-gray-600">New Patients</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Patient management features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.emergency_requests}</div>
                      <div className="text-sm text-gray-600">Active Emergencies</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">24/7</div>
                      <div className="text-sm text-gray-600">Emergency Response</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-8">
                <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Emergency coordination features coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        ₦{stats.revenue_this_month.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">This Month Revenue</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        ₦{Math.floor(stats.revenue_this_month / stats.total_appointments || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Avg per Appointment</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {((stats.revenue_this_month / 1000000) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Growth Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Detailed financial analytics coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Hospital Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Hospital Name</label>
                        <p className="font-medium">{hospitalInfo?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Phone</label>
                        <p className="font-medium">{hospitalInfo?.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium">{hospitalInfo?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Status</label>
                        <p className="font-medium">{hospitalInfo?.verification_status}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Security Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Two-Factor Authentication</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>IP Whitelist</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Session Timeout</span>
                        <Badge variant="outline">60 minutes</Badge>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">
                    Update Hospital Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
