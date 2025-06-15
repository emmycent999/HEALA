
export type PatientDashboardTab = 
  | 'appointments'
  | 'wallet'
  | 'virtual-consultation'
  | 'chat'
  | 'ai-assistant'
  | 'prescriptions'
  | 'health-records'
  | 'symptom-checker'
  | 'emergency-contacts'
  | 'accessibility'
  | 'offline'
  | 'physician'
  | 'emergency'
  | 'profile'
  | 'transport'
  | 'subscription'
  | 'ambulance';

export interface PatientDashboardProps {
  activeTab: PatientDashboardTab;
}
