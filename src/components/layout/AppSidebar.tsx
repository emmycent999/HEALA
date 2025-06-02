
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  MessageCircle, 
  AlertTriangle, 
  User, 
  Car, 
  CreditCard, 
  Ambulance,
  Users,
  Activity,
  BarChart3,
  Stethoscope,
  Settings,
  Home,
  UserPlus,
  Shield,
  FileText
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/logo';

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  // Patient items
  { title: 'Appointments', url: '/patient?tab=appointments', icon: Calendar, roles: ['patient'] },
  { title: 'AI Health Chat', url: '/patient?tab=chat', icon: MessageCircle, roles: ['patient'] },
  { title: 'Emergency', url: '/patient?tab=emergency', icon: AlertTriangle, roles: ['patient'] },
  { title: 'Profile', url: '/patient?tab=profile', icon: User, roles: ['patient'] },
  { title: 'Transport', url: '/patient?tab=transport', icon: Car, roles: ['patient'] },
  { title: 'Subscription', url: '/patient?tab=subscription', icon: CreditCard, roles: ['patient'] },
  { title: 'Ambulance Status', url: '/patient?tab=ambulance', icon: Ambulance, roles: ['patient'] },

  // Physician items
  { title: 'Overview', url: '/physician?tab=overview', icon: Home, roles: ['physician'] },
  { title: 'My Patients', url: '/physician?tab=patients', icon: Users, roles: ['physician'] },
  { title: 'Appointments', url: '/physician?tab=appointments', icon: Calendar, roles: ['physician'] },
  { title: 'Communication', url: '/physician?tab=chat', icon: MessageCircle, roles: ['physician'] },
  { title: 'My Profile', url: '/physician?tab=profile', icon: User, roles: ['physician'] },

  // Hospital Admin items
  { title: 'Overview', url: '/hospital?tab=overview', icon: Home, roles: ['hospital_admin'] },
  { title: 'Physicians', url: '/hospital?tab=physicians', icon: Stethoscope, roles: ['hospital_admin'] },
  { title: 'Appointments', url: '/hospital?tab=appointments', icon: Calendar, roles: ['hospital_admin'] },
  { title: 'Emergency', url: '/hospital?tab=emergency', icon: AlertTriangle, roles: ['hospital_admin'] },
  { title: 'Analytics', url: '/hospital?tab=analytics', icon: BarChart3, roles: ['hospital_admin'] },

  // Agent items
  { title: 'Overview', url: '/agent?tab=overview', icon: Home, roles: ['agent'] },
  { title: 'Patient Lookup', url: '/agent?tab=lookup', icon: Users, roles: ['agent'] },
  { title: 'Appointments', url: '/agent?tab=appointments', icon: Calendar, roles: ['agent'] },
  { title: 'Transport', url: '/agent?tab=transport', icon: Car, roles: ['agent'] },
  { title: 'Emergency', url: '/agent?tab=emergency', icon: AlertTriangle, roles: ['agent'] },
  { title: 'Support Chat', url: '/agent?tab=chat', icon: MessageCircle, roles: ['agent'] },

  // Admin items
  { title: 'Analytics', url: '/admin?tab=analytics', icon: BarChart3, roles: ['admin'] },
  { title: 'Verifications', url: '/admin?tab=verifications', icon: Shield, roles: ['admin'] },
  { title: 'User Management', url: '/admin?tab=users', icon: UserPlus, roles: ['admin'] },
  { title: 'Documents', url: '/admin?tab=documents', icon: FileText, roles: ['admin'] },
  { title: 'Testing', url: '/admin?tab=testing', icon: Settings, roles: ['admin'] },
  { title: 'Test Suite', url: '/admin?tab=automated', icon: Activity, roles: ['admin'] }
];

export const AppSidebar: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();

  const userRole = profile?.role || 'patient';
  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  const isActive = (url: string) => {
    const currentUrl = `${location.pathname}${location.search}`;
    return currentUrl === url || currentUrl.startsWith(url.split('?')[0]);
  };

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-semibold text-lg capitalize">{userRole} Portal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2 w-full">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {profile?.first_name && (
            <p>Welcome, {profile.first_name}!</p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
