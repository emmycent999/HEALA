
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      // Redirect based on role
      switch (profile.role) {
        case 'patient':
          navigate('/patient-dashboard');
          break;
        case 'physician':
          navigate('/physician-dashboard');
          break;
        case 'hospital_admin':
          navigate('/hospital-dashboard');
          break;
        case 'agent':
          navigate('/agent-dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, navigate]);

  return (
    <AuthLayout
      title="Join Heala"
      description="Create your account to get started"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register;
