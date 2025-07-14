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
  LogOut,
  LayoutDashboard, // New icon for admin section
  List, // New icon for company list
  UsersRound, // New icon for user management
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

function SidebarLink({
  href,
  icon,
  children,
  isActive,
  isCollapsed,
  onClick,
}: SidebarLinkProps) {
  const linkContent = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex justify-start items-center space-x-0 space-y-0 p-2 rounded-lg transition-colors text-sm font-medium',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
      )}
    >
      <span className="flex justify-center items-center flex-grow-0 flex-shrink-0 self-center w-fit">
        {icon}
      </span>
      <span
        className={cn(
          'overflow-hidden transition-all duration-300 truncate',
          !isCollapsed && 'px-3 w-full',
          isCollapsed && 'px-0 w-[0%]',
        )}
      >
        {children}
      </span>
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
  const { user, logout } = useAuth();

  // Define navigation items based on user role
  const getNavigation = () => {
    if (!user) return [];

    if (user.role === 'super_admin') {
      return [
        {
          href: '/sentinelzone/dashboard',
          icon: <LayoutDashboard className="w-6 h-6" />,
          label: 'Dashboard',
        },
        {
          href: '/sentinelzone/companies',
          icon: <List className="w-6 h-6" />,
          label: 'Gestionar Empresas',
        },
      ];
    }

    const commonNavigation = [
      {
        href: '/',
        icon: <Calendar className="w-6 h-6" />,
        label: 'Organigrama',
      },
      {
        href: '/employees',
        icon: <Users className="w-6 h-6" />,
        label: 'Empleados',
      },
      {
        href: '/positions',
        icon: <Briefcase className="w-6 h-6" />,
        label: 'Puestos',
      },
      {
        href: '/clientes',
        icon: <Building className="w-6 h-6" />,
        label: 'Clientes',
      },
      {
        href: '/reports',
        icon: <BarChart3 className="w-6 h-6" />,
        label: 'Reportes',
      },
      {
        href: '/estructura',
        icon: <Map className="w-6 h-6" />,
        label: 'Estructura',
      },
    ];

    if (user.role === 'admin') {
      commonNavigation.push({
        href: '/users',
        icon: <UsersRound className="w-6 h-6" />,
        label: 'Usuarios',
      });
    }

    return commonNavigation;
  };

  const navigation = getNavigation();

  const handleNavigate = () => {
    setIsCollapsed(true);
    setTimeout(() => {
      const main = document.getElementById('main-content');
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-fit md:h-full bg-white border-neutral-200 border-r transition-all duration-300 absolute md:static z-50 md:z-auto',
        isCollapsed ? 'w-16' : 'w-64 border-b md:border-0 md:border-r',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b border-neutral-200',
          isCollapsed && 'justify-center',
        )}
      >
        {!isCollapsed && (
          <div
            className={cn(
              'flex items-center space-x-3 cursor-pointer transition-all duration-300',
              !isCollapsed && 'w-full',
              isCollapsed && 'w-[0%]',
            )}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="w-[32px] h-[32px] bg-primary rounded-lg flex-grow-0 flex-shrink-0 flex items-center justify-center">
              <Calendar className="text-white w-[20px] h-[20px]" />
            </div>
            <h1 className="text-sm font-bold text-neutral-900">HorariosPro</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn('p-1 h-[32px] w-[32px]')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-[20px] h-[20px] flex-grow-0 flex-shrink-0" />
          ) : (
            <ChevronLeft className="w-[20px] h-[20px] flex-grow-0 flex-shrink-0" />
          )}
        </Button>
      </div>

      {/* Nav */}
      <nav
        className={cn(
          'flex-1 p-3 space-y-1',
          isCollapsed ? 'hidden md:block' : '',
        )}
      >
        {navigation.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            isActive={location === item.href}
            isCollapsed={isCollapsed}
            onClick={handleNavigate}
          >
            {item.label}
          </SidebarLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div
          className={cn(
            'p-3 border-t border-neutral-200',
            isCollapsed ? 'hidden md:block' : '',
          )}
        >
          <div
            className={cn(
              'flex items-center',
              !isCollapsed && 'flex-row space-x-3',
              isCollapsed && 'flex-col space-y-1',
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center items-center flex-grow-0 flex-shrink-0 self-center w-8 h-8 bg-neutral-300 rounded-full">
                  <User className="w-6 h-6 text-neutral-600" />
                </div>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-neutral-500 truncate capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
            <div className={cn('flex-1 min-w-0', isCollapsed && 'hidden')}>
              <p className="text-sm font-medium text-neutral-900 truncate">
                {user.username}
              </p>
              <p className="text-xs text-neutral-500 truncate capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="w-8 h-8"
                >
                  <LogOut className="w-4 h-4 min-w-4 min-h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Cerrar sesión</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
