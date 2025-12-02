import { useState } from 'react';
import { Users, ChevronUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { User } from '../lib/types';
import { mockUsers } from '../lib/mock-data';

interface UserSwitcherProps {
  currentUser: User | null;
  onUserChange: (user: User) => void;
}

export function UserSwitcher({ currentUser, onUserChange }: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'operador':
        return 'default';
      case 'agente':
        return 'secondary';
      case 'administrador':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'operador':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'agente':
        return 'bg-green-500 hover:bg-green-600';
      case 'administrador':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-primary hover:bg-primary/90';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'operador':
        return '👨‍💼';
      case 'agente':
        return '🚨';
      case 'administrador':
        return '⚙️';
      default:
        return '👤';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="lg"
            className={`h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative hover:scale-105 ${
              currentUser ? getRoleColor(currentUser.role) : 'bg-primary hover:bg-primary/90'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-base">{currentUser ? getRoleIcon(currentUser.role) : '👤'}</span>
              <ChevronUp className={`h-2.5 w-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {/* Indicador de demo */}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] px-1 py-0.5 rounded-full font-medium">
              DEMO
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          side="top" 
          className="w-64 mb-2 animate-in slide-in-from-bottom-2 duration-200"
          sideOffset={8}
        >
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium">Demo - Cambiar Usuario</p>
            <p className="text-xs text-muted-foreground">
              Usuario actual: {currentUser?.name || 'Ninguno'}
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          {mockUsers.map((user) => (
            <DropdownMenuItem 
              key={user.id}
              onClick={() => {
                onUserChange(user);
                setIsOpen(false);
                toast.success(`Cambiado a usuario: ${user.name}`, {
                  description: `Rol: ${user.role}`,
                  duration: 2000,
                });
              }}
              className={`px-3 py-3 cursor-pointer ${
                currentUser?.id === user.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start space-x-3 flex-1">
                <span className="text-lg">{getRoleIcon(user.role)}</span>
                <div className="flex flex-col space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{user.name}</span>
                    <Badge 
                      variant={getRoleBadgeVariant(user.role)}
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}