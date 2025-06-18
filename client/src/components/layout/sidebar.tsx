import { Link, useLocation } from "wouter";
import { 
  Calendar, 
  Users, 
  Briefcase, 
  Clock, 
  BarChart3, 
  Map,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

function SidebarLink({ href, icon, children, isActive }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a className={cn("sidebar-link", isActive && "active")}>
        {icon}
        <span>{children}</span>
      </a>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { href: "/", icon: <Calendar className="w-5 h-5" />, label: "Calendario" },
    { href: "/organigrama", icon: <Map className="w-5 h-5" />, label: "Organigrama" },
    { href: "/employees", icon: <Users className="w-5 h-5" />, label: "Empleados" },
    { href: "/positions", icon: <Briefcase className="w-5 h-5" />, label: "Puestos" },
    { href: "/shifts", icon: <Clock className="w-5 h-5" />, label: "Turnos" },
    { href: "/reports", icon: <BarChart3 className="w-5 h-5" />, label: "Reportes" },
  ];

  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-neutral-900">HorariosPro</h1>
            <p className="text-xs text-neutral-500">Control de Turnos</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.href}>
              <SidebarLink
                href={item.href}
                icon={item.icon}
                isActive={location === item.href}
              >
                {item.label}
              </SidebarLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-neutral-300 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">Admin Usuario</p>
            <p className="text-xs text-neutral-500 truncate">Administrador</p>
          </div>
        </div>
      </div>
    </>
  );
}
