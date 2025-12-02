import { useState } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  whatsapp: boolean;
  sms: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email: true,
  push: true,
  whatsapp: true,
  sms: false,
};

export function NotificacionesTab() {
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [quietHours, setQuietHours] = useState({
    from: '08:00',
    to: '22:00',
  });
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'Hola {nombre}, recibimos tu reclamo #{numero}. ¡Gracias por comunicarte!',
  );

  const handleSave = () => {
    toast.success('Preferencias de notificación actualizadas.');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones por correo</Label>
              <p className="text-sm text-muted-foreground">
                Enviá alertas y resúmenes por correo electrónico.
              </p>
            </div>
            <Switch
              checked={settings.email}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, email: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificaciones push</Label>
              <p className="text-sm text-muted-foreground">
                Activá alertas en el navegador mientras la app esté abierta.
              </p>
            </div>
            <Switch
              checked={settings.push}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, push: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Mensajes de WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Avisá automáticamente al denunciante sobre actualizaciones.
              </p>
            </div>
            <Switch
              checked={settings.whatsapp}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, whatsapp: checked }))
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>SMS de respaldo</Label>
              <p className="text-sm text-muted-foreground">
                Utilizá SMS cuando el contacto no pueda recibir mensajes por
                WhatsApp.
              </p>
            </div>
            <Switch
              checked={settings.sms}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, sms: checked }))
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Plantilla de WhatsApp
          </div>
          <Textarea
            rows={4}
            value={whatsappTemplate}
            onChange={(event) => setWhatsappTemplate(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Podés utilizar variables como {'{nombre}'} o {'{numero}'} para
            personalizar los mensajes automáticamente.
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            Horario silencioso
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Desde</Label>
              <Input
                type="time"
                value={quietHours.from}
                onChange={(event) =>
                  setQuietHours((prev) => ({
                    ...prev,
                    from: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input
                type="time"
                value={quietHours.to}
                onChange={(event) =>
                  setQuietHours((prev) => ({
                    ...prev,
                    to: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Guardar cambios</Button>
        </div>
      </CardContent>
    </Card>
  );
}
