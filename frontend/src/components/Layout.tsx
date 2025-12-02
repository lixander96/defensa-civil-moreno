import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, MessageCircle, FileText, Map, BarChart3, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { User as UserType } from '../lib/types';
import exampleImage from 'figma:asset/782ecd565a23a3d042897c5ebe443b4e20ada8b0.png';

interface LayoutProps {
  onLogout: () => void;
  user: UserType | null;
}

type NavItem = {
  id: string;
  label: string;
  icon: typeof MessageCircle;
  to: string;
  match?: string;
};

export function Layout({ onLogout, user }: LayoutProps) {
  const location = useLocation();

  const menuItems: NavItem[] = [
    { id: 'conversaciones', label: 'Conversaciones', icon: MessageCircle, to: '/conversaciones' },
    { id: 'reclamos', label: 'Reclamos', icon: FileText, to: '/reclamos' },
    { id: 'mapa', label: 'Mapa', icon: Map, to: '/mapa' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, to: '/reportes' },
    { id: 'configuracion', label: 'Configuración', icon: Settings, to: '/configuracion/general', match: '/configuracion' },
  ];

  const items = menuItems;

  const isActive = (item: NavItem) => {
    const target = (item.match ?? item.to).replace(/\/$/, '');
    const pathname = location.pathname.replace(/\/$/, '');
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={exampleImage}
            alt="Municipio de Moreno"
            className="h-8 w-auto"
          />
          <div className="hidden md:block">
            <h1 className="font-medium">Defensa Civil Moreno</h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestión de Emergencias</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Hola,</span>
            <span className="font-medium">{user?.name ?? user?.username ?? 'Usuario'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-4 hidden md:block">
          <nav className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  asChild
                  variant={isActive(item) ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <NavLink to={item.to}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </NavLink>
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-card p-2 z-50 safe-area-inset-bottom">
          <nav className="flex justify-around">
            {items.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  asChild
                  variant={isActive(item) ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-col h-12 px-1 min-w-0"
                >
                  <NavLink to={item.to}>
                    <Icon className="h-4 w-4" />
                    <span className="text-xs mt-1 truncate">{item.label}</span>
                  </NavLink>
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden mb-0 md:mb-0 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
