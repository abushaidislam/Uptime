import { 
  Home, 
  User, 
  Activity, 
  AlertTriangle, 
  Bell, 
  Globe, 
  BarChart3, 
  Shield,
  Zap,
} from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'common:routes.dashboard',
    children: [
      {
        label: 'Overview',
        path: '/home',
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'Monitors',
        path: '/home/monitors',
        Icon: <Activity className={iconClasses} />,
      },
      {
        label: 'Incidents',
        path: '/home/incidents',
        Icon: <AlertTriangle className={iconClasses} />,
      },
      {
        label: 'Alerts',
        path: '/home/alerts',
        Icon: <Bell className={iconClasses} />,
      },
      {
        label: 'Status Page',
        path: '/home/status-page',
        Icon: <Globe className={iconClasses} />,
      },
      {
        label: 'Analytics',
        path: '/home/analytics',
        Icon: <BarChart3 className={iconClasses} />,
      },
    ],
  },
  {
    label: 'common:routes.settings',
    children: [
      {
        label: 'common:routes.profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
      {
        label: 'Notifications',
        path: '/home/settings/notifications',
        Icon: <Bell className={iconClasses} />,
      },
      {
        label: 'SSL Certificates',
        path: '/home/ssl',
        Icon: <Shield className={iconClasses} />,
      },
      {
        label: 'Team',
        path: '/home/settings/team',
        Icon: <User className={iconClasses} />,
      },
      {
        label: 'Integrations',
        path: '/home/settings/integrations',
        Icon: <Zap className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
