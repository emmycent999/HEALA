
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle, Clock, Download, Shield, Eye, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReport {
  id: string;
  type: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  lastUpdated: string;
  nextDue: string;
  description: string;
}

interface AuditTrail {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
  type: 'access' | 'modification' | 'deletion' | 'creation';
}

export const HospitalComplianceManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.hospital_id) {
      fetchComplianceData();
      fetchAuditTrails();
    }
  }, [profile?.hospital_id]);

  const fetchComplianceData = async () => {
    try {
      // Generate mock compliance reports for demonstration
      const mockReports: ComplianceReport[] = [
        {
          id: '1',
          type: 'HIPAA Compliance',
          status: 'compliant',
          lastUpdated: '2024-06-10',
          nextDue: '2024-12-10',
          description: 'Patient data protection and privacy compliance'
        },
        {
          id: '2',
          type: 'Medical Records Management',
          status: 'compliant',
          lastUpdated: '2024-06-05',
          nextDue: '2024-09-05',
          description: 'Electronic health records compliance and retention'
        },
        {
          id: '3',
          type: 'Staff Certification',
          status: 'pending',
          lastUpdated: '2024-05-15',
          nextDue: '2024-07-15',
          description: 'Medical staff licensing and certification verification'
        },
        {
          id: '4',
          type: 'Quality Assurance',
          status: 'non_compliant',
          lastUpdated: '2024-04-20',
          nextDue: '2024-06-20',
          description: 'Quality management system compliance'
        },
        {
          id: '5',
          type: 'Data Security',
          status: 'compliant',
          lastUpdated: '2024-06-12',
          nextDue: '2024-12-12',
          description: 'Information security and data breach prevention'
        }
      ];
      setComplianceReports(mockReports);
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditTrails = async () => {
    try {
      // Generate mock audit trails
      const mockAudits: AuditTrail[] = [
        {
          id: '1',
          action: 'Patient record accessed',
          user: 'Dr. Sarah Johnson',
          timestamp: new Date().toISOString(),
          details: 'Viewed patient medical history - Patient ID: 12345',
          type: 'access'
        },
        {
          id: '2',
          action: 'Prescription created',
          user: 'Dr. Michael Chen',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          details: 'Created prescription for antibiotics - Patient ID: 12346',
          type: 'creation'
        },
        {
          id: '3',
          action: 'Medical record updated',
          user: 'Nurse Emma Wilson',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'Updated vital signs and patient notes - Patient ID: 12347',
          type: 'modification'
        },
        {
          id: '4',
          action: 'User login',
          user: 'Admin John Doe',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'Hospital administrator logged into system',
          type: 'access'
        }
      ];
      setAuditTrails(mockAudits);
    } catch (error) {
      console.error('Error fetching audit trails:', error);
    }
  };

  const generateComplianceReport = async (reportType: string) => {
    toast({
      title: "Generating Report",
      description: `Compliance report for ${reportType} is being generated.`,
    });
    // Implementation for report generation would go here
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'non_compliant':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAuditTypeIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="w-4 h-4 text-blue-600" />;
      case 'modification': return <FileText className="w-4 h-4 text-orange-600" />;
      case 'creation': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deletion': return <Archive className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="p-6">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliant</p>
                <p className="text-2xl font-bold text-green-600">
                  {complianceReports.filter(r => r.status === 'compliant').length}
                </p>
                <p className="text-xs text-gray-500">Reports</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">
                  {complianceReports.filter(r => r.status === 'non_compliant').length}
                </p>
                <p className="text-xs text-gray-500">Reports</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {complianceReports.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-blue-600">87%</p>
                <p className="text-xs text-gray-500">Overall</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Compliance Reports
            </div>
            <Button onClick={() => generateComplianceReport('All')}>
              <Download className="w-4 h-4 mr-2" />
              Export All Reports
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getStatusIcon(report.status)}
                  <div>
                    <h4 className="font-medium">{report.type}</h4>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Last Updated: {new Date(report.lastUpdated).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Next Due: {new Date(report.nextDue).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(report.status)}>
                    {report.status.replace('_', ' ')}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => generateComplianceReport(report.type)}>
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditTrails.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getAuditTypeIcon(audit.type)}
                  <div>
                    <p className="font-medium">{audit.action}</p>
                    <p className="text-sm text-gray-600">{audit.details}</p>
                    <p className="text-xs text-gray-500">by {audit.user}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(audit.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
