import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  Plus,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StaffSchedule {
  id: string;
  staff_id: string;
  department: string;
  shift_type: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  staff_name?: string;
  staff_role?: string;
}

interface StaffAttendance {
  id: string;
  schedule_id: string;
  staff_id: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'absent';
  staff_name?: string;
}

export const StaffScheduleManagement: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user && profile?.hospital_id) {
      fetchSchedules();
      fetchAttendance();
    }
  }, [user, profile, selectedDate]);

  const fetchSchedules = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_schedules')
        .select(`
          *,
          profiles!staff_schedules_staff_id_fkey (
            first_name,
            last_name,
            role
          )
        `)
        .eq('hospital_id', profile.hospital_id)
        .gte('start_date', selectedDate)
        .lte('end_date', selectedDate)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedData: StaffSchedule[] = (data || []).map(schedule => ({
        id: schedule.id,
        staff_id: schedule.staff_id,
        department: schedule.department,
        shift_type: schedule.shift_type,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status as 'scheduled' | 'confirmed' | 'cancelled',
        staff_name: schedule.profiles 
          ? `${schedule.profiles.first_name} ${schedule.profiles.last_name}`
          : 'Unknown Staff',
        staff_role: schedule.profiles?.role || 'staff'
      }));

      setSchedules(formattedData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Error",
        description: "Failed to load schedules.",
        variant: "destructive"
      });
    }
  };

  const fetchAttendance = async () => {
    if (!profile?.hospital_id) return;

    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select(`
          *,
          staff_schedules!staff_attendance_schedule_id_fkey (
            start_date,
            hospital_id
          ),
          profiles!staff_attendance_staff_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('staff_schedules.hospital_id', profile.hospital_id)
        .eq('staff_schedules.start_date', selectedDate);

      if (error) throw error;

      const formattedData: StaffAttendance[] = (data || []).map(attendance => ({
        id: attendance.id,
        schedule_id: attendance.schedule_id,
        staff_id: attendance.staff_id,
        check_in_time: attendance.check_in_time,
        check_out_time: attendance.check_out_time,
        status: attendance.status as 'scheduled' | 'checked_in' | 'checked_out' | 'absent',
        staff_name: attendance.profiles 
          ? `${attendance.profiles.first_name} ${attendance.profiles.last_name}`
          : 'Unknown Staff'
      }));

      setAttendance(formattedData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (scheduleId: string, staffId: string, action: 'check_in' | 'check_out') => {
    try {
      const now = new Date().toISOString();
      const updateData = action === 'check_in' 
        ? { check_in_time: now, status: 'checked_in' }
        : { check_out_time: now, status: 'checked_out' };

      // First, try to update existing attendance record
      const { data: existingAttendance } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('staff_id', staffId)
        .single();

      if (existingAttendance) {
        const { error } = await supabase
          .from('staff_attendance')
          .update(updateData)
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        // Create new attendance record
        const { error } = await supabase
          .from('staff_attendance')
          .insert({
            schedule_id: scheduleId,
            staff_id: staffId,
            ...updateData
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Staff ${action === 'check_in' ? 'checked in' : 'checked out'} successfully.`,
      });

      fetchAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance.",
        variant: "destructive"
      });
    }
  };

  const getShiftColor = (shiftType: string) => {
    switch (shiftType.toLowerCase()) {
      case 'morning':
        return 'bg-yellow-100 text-yellow-800';
      case 'afternoon':
        return 'bg-orange-100 text-orange-800';
      case 'evening':
        return 'bg-blue-100 text-blue-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'checked_out':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalStaff = schedules.length;
  const checkedIn = attendance.filter(a => a.status === 'checked_in').length;
  const departments = [...new Set(schedules.map(s => s.department))];

  if (loading) {
    return <div className="p-6">Loading schedules...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Staff Schedule Management</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2"
          />
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff Scheduled</p>
                <p className="text-2xl font-bold">{totalStaff}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently On Duty</p>
                <p className="text-2xl font-bold">{checkedIn}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold">
                  {totalStaff > 0 ? Math.round((checkedIn / totalStaff) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No staff scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{schedule.staff_name}</h4>
                          <p className="text-sm text-gray-600">{schedule.department}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getShiftColor(schedule.shift_type)}>
                            {schedule.shift_type}
                          </Badge>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Shift Time</p>
                          <p className="text-sm">{schedule.start_time} - {schedule.end_time}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Role</p>
                          <p className="text-sm capitalize">{schedule.staff_role}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date Range</p>
                          <p className="text-sm">{schedule.start_date} to {schedule.end_date}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAttendance(schedule.id, schedule.staff_id, 'check_in')}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Check In
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAttendance(schedule.id, schedule.staff_id, 'check_out')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Check Out
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance records for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendance.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{record.staff_name}</h4>
                        </div>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Check In</p>
                          <p className="text-sm">
                            {record.check_in_time 
                              ? new Date(record.check_in_time).toLocaleTimeString()
                              : 'Not checked in'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Check Out</p>
                          <p className="text-sm">
                            {record.check_out_time 
                              ? new Date(record.check_out_time).toLocaleTimeString()
                              : 'Not checked out'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
