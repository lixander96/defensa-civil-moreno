import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { GeneralTab } from './configuracion/GeneralTab';
import { UsuariosTab } from './configuracion/UsuariosTab';
import { IncidentesTab } from './configuracion/IncidentesTab';
import { AreasTab } from './configuracion/AreasTab';
import { WhatsappTab } from './configuracion/WhatsappTab';
import { NotificacionesTab } from './configuracion/NotificacionesTab';
import { SistemaTab } from './configuracion/SistemaTab';

type Section =
  | 'general'
  | 'usuarios'
  | 'incidentes'
  | 'areas'
  | 'whatsapp'
  | 'notificaciones'
  | 'sistema';

function computeSections(role?: string | null): Section[] {
  const normalized = role?.toUpperCase();

  if (normalized === 'ADMIN' || normalized === 'MANAGER') {
    return [
      'general',
      'usuarios',
      'incidentes',
      'areas',
      'whatsapp',
      'notificaciones',
      'sistema',
    ];
  }

  if (normalized === 'OPERATOR' || normalized === 'AGENT') {
    return ['general', 'whatsapp', 'notificaciones'];
  }

  return ['general', 'notificaciones'];
}

export function Configuracion() {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Section>('general');
  const [areasVersion, setAreasVersion] = useState(0);

  const sections = useMemo(() => computeSections(user?.role), [user?.role]);

  const handleAreasChanged = () => {
    setAreasVersion((prev) => prev + 1);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6">
        <div>
          <h2>Configuración</h2>
          <p className="text-muted-foreground">
            Gestioná la configuración del sistema y preferencias
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Section)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7">
            <TabsTrigger value="general">General</TabsTrigger>
            {sections.includes('usuarios') && (
              <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            )}
            {sections.includes('incidentes') && (
              <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
            )}
            {sections.includes('areas') && (
              <TabsTrigger value="areas">Áreas</TabsTrigger>
            )}
            {sections.includes('whatsapp') && (
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            )}
            <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
            {sections.includes('sistema') && (
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <GeneralTab user={user} theme={theme} onToggleTheme={toggleTheme} />
          </TabsContent>

          {sections.includes('usuarios') && (
            <TabsContent value="usuarios" className="space-y-6">
              <UsuariosTab token={token} currentUserId={user?.id ?? null} />
            </TabsContent>
          )}

          {sections.includes('incidentes') && (
            <TabsContent value="incidentes" className="space-y-6">
              <IncidentesTab token={token} areasVersion={areasVersion} />
            </TabsContent>
          )}

          {sections.includes('areas') && (
            <TabsContent value="areas" className="space-y-6">
              <AreasTab token={token} onAreasChanged={handleAreasChanged} />
            </TabsContent>
          )}

          {sections.includes('whatsapp') && (
            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsappTab token={token} />
            </TabsContent>
          )}

          <TabsContent value="notificaciones" className="space-y-6">
            <NotificacionesTab />
          </TabsContent>

          {sections.includes('sistema') && (
            <TabsContent value="sistema" className="space-y-6">
              <SistemaTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
