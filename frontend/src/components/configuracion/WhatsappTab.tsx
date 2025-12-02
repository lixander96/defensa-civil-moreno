import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  RefreshCcw,
  Smartphone,
  Unplug,
  QrCode,
  PlugZap,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  connectWhatsapp,
  getWhatsappStatus,
  logoutWhatsapp,
} from '../../lib/api';
import { WhatsappStatus } from '../../lib/types';
import { toast } from 'sonner@2.0.3';

interface WhatsappTabProps {
  token: string | null;
}

type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function resolveStatusLabel(status?: WhatsappStatus | null): {
  label: string;
  variant: StatusVariant;
} {
  switch (status?.status) {
    case 'connected':
      return { label: 'Conectado', variant: 'default' };
    case 'authenticated':
      return { label: 'Autenticado', variant: 'default' };
    case 'qr':
      return { label: 'Escaneá el código QR', variant: 'secondary' };
    case 'connecting':
      return { label: 'Conectando...', variant: 'secondary' };
    case 'failed':
      return { label: 'Error de conexión', variant: 'destructive' };
    case 'disconnected':
      return { label: 'Desconectado', variant: 'outline' };
    default:
      return { label: 'Sin conexión', variant: 'outline' };
  }
}

export function WhatsappTab({ token }: WhatsappTabProps) {
  const [status, setStatus] = useState<WhatsappStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const fetchStatus = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token) {
        setStatus(null);
        return;
      }

      if (!options?.silent) {
        setIsLoading(true);
      }

      try {
        const data = await getWhatsappStatus(token);
        setStatus(data);
      } catch (error) {
        console.error('Error fetching WhatsApp status', error);
        if (!options?.silent) {
          toast.error('No se pudo obtener el estado de WhatsApp.');
        }
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [token],
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!token) {
      return;
    }
    const shouldPoll =
      !status ||
      status.status === 'qr' ||
      status.status === 'connecting' ||
      status.status === 'failed' ||
      status.status === 'disconnected' ||
      status.status === 'idle';

    if (!shouldPoll) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchStatus({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [token, status?.status, fetchStatus]);

  const handleConnect = async () => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }
    setIsConnecting(true);
    try {
      const data = await connectWhatsapp(token);
      setStatus(data);
      toast.success('Solicitud de conexión enviada.');
    } catch (error) {
      console.error('Error connecting WhatsApp', error);
      toast.error('No se pudo iniciar la conexión.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }
    setIsDisconnecting(true);
    try {
      const data = await logoutWhatsapp(token);
      setStatus(data);
      toast.success('Sesión de WhatsApp finalizada.');
    } catch (error) {
      console.error('Error disconnecting WhatsApp', error);
      toast.error('No se pudo cerrar la sesión de WhatsApp.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusInfo = useMemo(() => resolveStatusLabel(status), [status]);

  const qrGeneratedAt = useMemo(() => {
    if (!status?.qr?.generatedAt) {
      return null;
    }
    const parsed = new Date(status.qr.generatedAt);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toLocaleString();
  }, [status?.qr?.generatedAt]);

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Iniciá sesión para poder vincular una cuenta de WhatsApp.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Configuración de WhatsApp</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conectá el número oficial para gestionar mensajes entrantes y salientes.
            </p>
          </div>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || isDisconnecting}
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlugZap className="mr-2 h-4 w-4" />
            )}
            {status?.status === 'connected' || status?.status === 'authenticated'
              ? 'Reconectar'
              : 'Conectar'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDisconnect}
            disabled={isDisconnecting || isConnecting}
          >
            {isDisconnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Unplug className="mr-2 h-4 w-4" />
            )}
            Desconectar
          </Button>
          <Button
            variant="ghost"
            onClick={() => fetchStatus()}
            disabled={isLoading || isConnecting || isDisconnecting}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar estado
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Consultando estado de WhatsApp...
          </div>
        )}

        {status?.status === 'qr' && status.qr?.dataUrl && (
          <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" />
              Escaneá este código QR con la aplicación de WhatsApp Business para completar la vinculación.
            </div>
            <div className="flex justify-center">
              <img
                src={status.qr.dataUrl}
                alt="Código QR de WhatsApp"
                className="max-h-80 rounded-md border bg-white p-3"
              />
            </div>
            {qrGeneratedAt && (
              <p className="text-center text-xs text-muted-foreground">
                Generado el {qrGeneratedAt}.
              </p>
            )}
          </div>
        )}

        {(status?.status === 'connected' || status?.status === 'authenticated') && (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Smartphone className="h-4 w-4" />
              Sesión de WhatsApp conectada
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="text-muted-foreground">Número:</span>
                <p className="font-medium">
                  {status.number ?? 'Desconocido'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Perfil:</span>
                <p className="font-medium">
                  {status.pushName ?? 'Sin nombre de perfil'}
                </p>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Para revocar el acceso, hacé clic en “Desconectar”. Los mensajes entrantes dejarán de sincronizarse hasta volver a conectar.
            </p>
          </div>
        )}

        {!isLoading &&
          (!status || status.status === 'disconnected' || status.status === 'failed') && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Conectá una cuenta para comenzar a recibir y enviar mensajes automáticamente.
            </div>
          )}
      </CardContent>
    </Card>
  );
}
