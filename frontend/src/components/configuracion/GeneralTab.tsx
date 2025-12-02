import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { User } from '../../lib/types';
import { toast } from 'sonner@2.0.3';

type ThemeMode = 'dark' | 'light';

interface GeneralTabProps {
  user: User | null;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export function GeneralTab({ user, theme, onToggleTheme }: GeneralTabProps) {
  const [userPhone, setUserPhone] = useState(user?.phone ?? '');
  const [timezone, setTimezone] = useState('america/argentina/buenos_aires');
  const [language, setLanguage] = useState('es');

  const handleExportData = (type: string) => {
    toast.info(`La exportación de ${type} estará disponible próximamente.`);
  };

  const handleUpdateProfile = () => {
    toast.info('La actualización de perfil se implementará en una próxima versión.');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Tema de la aplicación</Label>
              <p className="text-sm text-muted-foreground">
                Cambia entre modo claro y oscuro
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Claro</span>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={() => onToggleTheme()}
              />
              <span className="text-sm">Oscuro</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Select
                value={timezone}
                onValueChange={(value) => setTimezone(value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america/argentina/buenos_aires">
                    Argentina/Buenos Aires (UTC-3)
                  </SelectItem>
                  <SelectItem value="america/new_york">
                    America/New York (UTC-5)
                  </SelectItem>
                  <SelectItem value="europe/madrid">
                    Europe/Madrid (UTC+1)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portugués</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4>Exportar Datos</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('reclamos')}
              >
                <Download className="mr-2 h-4 w-4" />
                Reclamos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('conversaciones')}
              >
                <Download className="mr-2 h-4 w-4" />
                Conversaciones
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportData('reportes')}
              >
                <Download className="mr-2 h-4 w-4" />
                Reportes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre</Label>
              <Input value={user?.name ?? ''} readOnly />
            </div>
            <div>
              <Label>Usuario</Label>
              <Input value={user?.username ?? ''} readOnly />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Rol</Label>
              <Input value={user?.role ?? ''} readOnly />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={userPhone}
                onChange={(event) => setUserPhone(event.target.value)}
                placeholder="Número de teléfono"
              />
            </div>
          </div>
          <Button onClick={handleUpdateProfile}>Actualizar Perfil</Button>
        </CardContent>
      </Card>
    </div>
  );
}
