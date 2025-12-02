import { useState } from 'react';
import { Database, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { toast } from 'sonner@2.0.3';

interface SystemSettings {
  autoAssign: boolean;
  slaAlerts: boolean;
  maintenanceMode: boolean;
  debugMode: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  autoAssign: true,
  slaAlerts: true,
  maintenanceMode: false,
  debugMode: false,
};

export function SistemaTab() {
  const [settings, setSettings] =
    useState<SystemSettings>(DEFAULT_SETTINGS);

  const handleBackup = (action: 'create' | 'download') => {
    toast.info(
      action === 'create'
        ? 'La creación de respaldos estará disponible pronto.'
        : 'La descarga de respaldos estará disponible pronto.',
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración del Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Asignación Automática</Label>
              <p className="text-sm text-muted-foreground">
                Distribuí los reclamos automáticamente entre los agentes disponibles.
              </p>
            </div>
            <Switch
              checked={settings.autoAssign}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, autoAssign: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas de SLA</Label>
              <p className="text-sm text-muted-foreground">
                Recibí recordatorios cuando un reclamo está por vencer.
              </p>
            </div>
            <Switch
              checked={settings.slaAlerts}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, slaAlerts: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Modo Mantenimiento</Label>
              <p className="text-sm text-muted-foreground">
                Habilitá el mantenimiento para realizar tareas administrativas.
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, maintenanceMode: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Modo Debug</Label>
              <p className="text-sm text-muted-foreground">
                Activá logs adicionales para tareas de diagnóstico.
              </p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, debugMode: checked }))
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4>Respaldo y restauración</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => handleBackup('create')}
            >
              <Database className="mr-2 h-4 w-4" />
              Crear respaldo
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBackup('download')}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar respaldo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
