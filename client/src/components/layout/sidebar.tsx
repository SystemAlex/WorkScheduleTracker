import * as React from 'react';
import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import {
  Users,
  Briefcase,
  BarChart3,
  Map,
  Calendar,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { withBase } from '@/lib/paths';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
}

function SidebarLink({
  href,
  icon,
  children,
  isActive,
  isCollapsed,
}: SidebarLinkProps) {
  const linkContent = (
    <Link
      href={href}
      className={cn(
        'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
        isCollapsed && 'justify-center px-2',
      )}
    >
      {icon}
      {!isCollapsed && <span>{children}</span>}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const navigation = [
    {
      href: withBase('/'),
      icon: <Calendar className="w-5 h-5" />,
      label: 'Calendario',
    },
    {
      href: withBase('/organigrama'),
      icon: <Map className="w-5 h-5" />,
      label: 'Organigrama',
    },
    {
      href: withBase('/employees'),
      icon: <Users className="w-5 h-5" />,
      label: 'Empleados',
    },
    {
      href: withBase('/positions'),
      icon: <Briefcase className="w-5 h-5" />,
      label: 'Puestos',
    },
    {
      href: withBase('/clientes'),
      icon: <Building className="w-5 h-5" />,
      label: 'Clientes',
    },
    {
      href: withBase('/reports'),
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Reportes',
    },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-neutral-200 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Header with toggle button */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-neutral-200',
          isCollapsed && 'justify-center',
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900">
                HorariosPro
              </h1>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <TooltipProvider>
          {navigation.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              isActive={location === item.href}
              isCollapsed={isCollapsed}
            >
              {item.label}
            </SidebarLink>
          ))}
        </TooltipProvider>
      </nav>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                Admin
              </p>
              <p className="text-xs text-neutral-500 truncate">Administrador</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
