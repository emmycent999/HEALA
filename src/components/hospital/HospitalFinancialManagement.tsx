
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FinancialMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  appointmentRevenue: number;
  emergencyRevenue: number;
  averagePerPatient: number;
  revenueGrowth: number;
  outstandingPayments: number;
  paymentSuccessRate: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  appointments: number;
  emergencies: number;
}

export const HospitalFinancialManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    appointmentRevenue: 0,
    emergencyRevenue: 0,
    averagePerPatient: 0,
    revenueGrowth: 0,
    outstandingPayments: 0,
    paymentSuccessRate: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchFinancialData();
    }
  }, [profile?.hospital_id, selectedPeriod]);

  const fetchFinancialData = async () => {
    if (!profile?.hospital_id) return;

    try {
      // Get current month data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

      // Fetch appointments revenue
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('*')
        .eq('hospital_id', profile.hospital_id)
        .eq('status', 'completed');

      // Fetch consultation sessions for revenue calculation
      const { data: sessionData } = await supabase
        .from('consultation_sessions')
        .select('consultation_rate, created_at, payment_status')
        .eq('payment_status', 'paid');

      // Calculate metrics (mock data for demonstration)
      const currentMonthRevenue = Math.floor(Math.random() * 500000) + 200000;
      const previousMonthRevenue = Math.floor(Math.random() * 400000) + 150000;
      const growth = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

      setMetrics({
        totalRevenue: currentMonthRevenue * 6, // 6 months total
        monthlyRevenue: currentMonthRevenue,
        appointmentRevenue: Math.floor(currentMonthRevenue * 0.7),
        emergencyRevenue: Math.floor(currentMonthRevenue * 0.3),
        averagePerPatient: Math.floor(currentMonthRevenue / (appointmentData?.length || 1)),
        revenueGrowth: growth,
        outstandingPayments: Math.floor(currentMonthRevenue * 0.05),
        paymentSuccessRate: 96.5
      });

      // Generate mock revenue data for chart
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push({
          month: monthName,
          revenue: Math.floor(Math.random() * 200000) + 150000,
          appointments: Math.floor(Math.random() * 100) + 50,
          emergencies: Math.floor(Math.random() * 20) + 5
        });
      }
      setRevenueData(months);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportFinancialReport = async () => {
    toast({
      title: "Generating Report",
      description: "Financial report generation started.",
    });
    // Implementation for report generation would go here
  };

  if (loading) {
    return <div className="p-6">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₦{metrics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.revenueGrowth > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.revenueGrowth.toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">₦{metrics.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Current month</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg per Patient</p>
                <p className="text-2xl font-bold">₦{metrics.averagePerPatient.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Treatment cost</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Success</p>
                <p className="text-2xl font-bold">{metrics.paymentSuccessRate}%</p>
                <p className="text-xs text-gray-500">Success rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Appointments</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₦{metrics.appointmentRevenue.toLocaleString()}</span>
                  <Badge variant="secondary">70%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Emergency Services</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">₦{metrics.emergencyRevenue.toLocaleString()}</span>
                  <Badge variant="secondary">30%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between text-red-600">
                <span>Outstanding Payments</span>
                <span className="font-medium">₦{metrics.outstandingPayments.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueData.slice(-3).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{data.month}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₦{data.revenue.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {data.appointments} appts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Financial Reports & Analytics
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedPeriod('week')}>
                Weekly
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedPeriod('month')}>
                Monthly
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedPeriod('year')}>
                Yearly
              </Button>
              <Button size="sm" onClick={exportFinancialReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">Monthly Statement</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Detailed breakdown of all revenue streams
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="font-medium">Performance Analytics</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Revenue trends and forecasting
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Tax Summary</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Tax calculations and compliance
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Download Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
