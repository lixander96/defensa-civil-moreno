import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  FileText,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Reclamo } from '../lib/types';
import { getComplaint } from '../lib/api';
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
} from '../lib/utils';

interface ReclamoDetailProps {
  token: string | null;
  reclamoId: string;
  onBack: () => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenAreaConversation?: (areaId: string) => void;
}

export function ReclamoDetail({
  token,
  reclamoId,
  onBack,
  onOpenConversation,
  onOpenAreaConversation,
}: ReclamoDetailProps) {
  const [reclamo, setReclamo] = useState<Reclamo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setReclamo(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await getComplaint(token, reclamoId);
        setReclamo(data);
      } catch (error) {
        setErrorMessage('No se pudo obtener la informacion del reclamo');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, reclamoId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-xl font-semibold">Detalle del reclamo</h1>
      </div>

      {token === null ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          No hay una sesion activa. Inicia sesion para consultar los detalles.
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          Cargando informacion del reclamo...
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-6 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : reclamo ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>#{reclamo.number}</span>
                <Badge className={getStatusColor(reclamo.status)}>
                  {getStatusLabel(reclamo.status)}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Registrado {formatDate(reclamo.createdAt)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Resumen
                </h2>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getPriorityColor(reclamo.priority)}
                    >
                      Prioridad {reclamo.priority}
                    </Badge>
                    {reclamo.typeLabel && (
                      <Badge variant="secondary">{reclamo.typeLabel}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reclamo.description}
                  </p>
                </div>
              </section>

              <Separator />

              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Denunciante
                </h2>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{reclamo.denunciante.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{reclamo.denunciante.phone}</span>
                  </div>
                  {reclamo.denunciante.address && (
                    <div className="text-muted-foreground">
                      {reclamo.denunciante.address}
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Ubicacion
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{reclamo.address}</span>
                </div>
                {reclamo.location && (
                  <div className="text-xs text-muted-foreground">
                    Lat {reclamo.location.lat} - Lng {reclamo.location.lng}
                  </div>
                )}
              </section>

              <Separator />

              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Seguimiento
                </h2>
                <div className="space-y-3">
                  {reclamo.timeline.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No hay eventos registrados.
                    </div>
                  ) : (
                    reclamo.timeline.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-lg border border-muted/40 bg-card px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDate(event.timestamp)}</span>
                          <span>{event.user}</span>
                        </div>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Asignacion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Area derivada</span>
                  <span className="font-medium">
                    {reclamo.derivedTo ?? 'Sin derivar'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Asignado a</span>
                  <span className="font-medium">
                    {reclamo.assignedToName ?? 'No asignado'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adjuntos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {reclamo.attachments.length === 0 ? (
                  <div className="text-muted-foreground">Sin archivos adjuntos.</div>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {reclamo.attachments.map((file, index) => (
                      <li key={`${file}-${index}`}>{file}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          No se encontro el reclamo solicitado.
        </div>
      )}
    </div>
  );
}
