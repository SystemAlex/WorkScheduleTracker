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
import { base } from '@/lib/paths';
import { useIsMobile } from '@/hooks/use-mobile';

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
          'overflow-hidden transition-all duration-300',
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
  const isMobile = useIsMobile();

  const navigation = [
    {
      href: base('/'),
      icon: <Calendar className="w-[23px] h-[23px]" />,
      label: 'Calendario',
    },
    {
      href: base('/employees'),
      icon: <Users className="w-[23px] h-[23px]" />,
      label: 'Empleados',
    },
    {
      href: base('/positions'),
      icon: <Briefcase className="w-[23px] h-[23px]" />,
      label: 'Puestos',
    },
    {
      href: base('/clientes'),
      icon: <Building className="w-[23px] h-[23px]" />,
      label: 'Clientes',
    },
    {
      href: base('/reports'),
      icon: <BarChart3 className="w-[23px] h-[23px]" />,
      label: 'Reportes',
    },
    {
      href: base('/organigrama'),
      icon: <Map className="w-[23px] h-[23px]" />,
      label: 'Organigrama',
    },
  ];

  const activeItem = navigation.find((item) => item.href === location);

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
          className={cn(
            'p-1 h-[32px] w-[32px]',
            isMobile && isCollapsed && 'bg-primary text-primary-foreground',
          )}
        >
          {isCollapsed ? (
            isMobile && activeItem?.icon ? (
              activeItem.icon
            ) : (
              <ChevronRight className="w-[20px] h-[20px] flex-grow-0 flex-shrink-0" />
            )
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
        {navigation.map(
          (item) => (
            (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                isActive={base(location) === item.href}
                isCollapsed={isCollapsed}
                onClick={handleNavigate}
              >
                {item.label}
              </SidebarLink>
            )
          ),
        )}
      </nav>

      {/* User */}
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
