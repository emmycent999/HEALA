
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  FileText,
  Search
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
  { title: 'Patient Lookup', url: '/agent?tab=lookup', icon: Search, roles: ['agent'] },
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
  const navigate = useNavigate();

  const userRole = profile?.role || 'patient';
  const filteredItems = sidebarItems.filter(item => item.roles.includes(userRole));

  const isActive = (url: string) => {
    const currentUrl = `${location.pathname}${location.search}`;
    return currentUrl === url || currentUrl.startsWith(url.split('?')[0]);
  };

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <SidebarHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-semibold text-lg capitalize text-gray-900 dark:text-white">
            {userRole === 'hospital_admin' ? 'Hospital' : userRole} Portal
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-gray-800">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 dark:text-gray-400">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <button 
                      onClick={() => handleNavigation(item.url)}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-left ${
                        isActive(item.url) 
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {profile?.first_name && (
            <p>Welcome, <span className="text-gray-900 dark:text-white font-medium">{profile.first_name}</span>!</p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
