
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
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
          case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, profile, navigate]);

  return (
    <AuthLayout
      title="Welcome Back"
      description="Sign in to your Heala account"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
