import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import { listComplaints } from '../lib/api';
import { mockReclamos } from '../lib/mock-data';
import { getStatusColor, getStatusLabel, getTypeLabel, formatDate } from '../lib/utils';
import { Reclamo } from '../lib/types';

interface MapaProps {
  token: string | null;
  onViewReclamo?: (reclamo: Reclamo) => void;
}

const DEFAULT_CENTER: [number, number] = [-34.650589, -58.791383];

const STATUS_HEX: Record<Reclamo['status'], string> = {
  abierto: '#ef4444',
  derivado: '#f97316',
  en_camino: '#f59e0b',
  verificado: '#22c55e',
  cerrado: '#6b7280',
};

function statusHex(status: Reclamo['status']): string {
  return STATUS_HEX[status] ?? '#6b7280';
}

function hasLocation(
  reclamo: Reclamo,
): reclamo is Reclamo & { location: { lat: number; lng: number } } {
  if (!reclamo.location) {
    return false;
  }

  const { lat, lng } = reclamo.location;
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [positions, map]);

  return null;
}

export function Mapa({ token, onViewReclamo }: MapaProps) {
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [typeVisibility, setTypeVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReclamos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!token) {
        setReclamos(mockReclamos);
        return;
      }

      const data = await listComplaints(token);
      setReclamos(data);
    } catch (err) {
      console.error('Failed to load complaints for map', err);
      setError('No se pudo cargar los reclamos. Se muestran datos simulados.');
      setReclamos(mockReclamos);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadReclamos();
  }, [loadReclamos]);

  const reclamosWithLocation = useMemo(
    () => reclamos.filter(hasLocation),
    [reclamos],
  );

  const statusOptions = useMemo(() => {
    const order: Reclamo['status'][] = [
      'abierto',
      'derivado',
      'en_camino',
      'verificado',
      'cerrado',
    ];
    return order.filter((status) =>
      reclamosWithLocation.some((reclamo) => reclamo.status === status),
    );
  }, [reclamosWithLocation]);

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    reclamosWithLocation.forEach((reclamo) => {
      if (!map.has(reclamo.type)) {
        map.set(reclamo.type, getTypeLabel(reclamo.type));
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [reclamosWithLocation]);

  useEffect(() => {
    if (typeOptions.length === 0) {
      setTypeVisibility({});
      return;
    }

    setTypeVisibility((prev) => {
      const next: Record<string, boolean> = { ...prev };
      let changed = false;

      typeOptions.forEach(({ value }) => {
        if (next[value] === undefined) {
          next[value] = true;
          changed = true;
        }
      });

      Object.keys(next).forEach((key) => {
        if (!typeOptions.some((option) => option.value === key)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [typeOptions]);

  const filteredReclamos = useMemo(() => {
    return reclamosWithLocation.filter((reclamo) => {
      if (!reclamo.location) {
        return false;
      }

      if (statusFilter !== 'all' && reclamo.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && reclamo.type !== typeFilter) {
        return false;
      }

      const visible = typeVisibility[reclamo.type];
      if (visible === false) {
        return false;
      }

      return true;
    });
  }, [reclamosWithLocation, statusFilter, typeFilter, typeVisibility]);

  useEffect(() => {
    if (
      selectedReclamo &&
      !filteredReclamos.some((reclamo) => reclamo.id === selectedReclamo.id)
    ) {
      setSelectedReclamo(null);
    }
  }, [filteredReclamos, selectedReclamo]);

  const positions = useMemo<[number, number][]>(() => {
    return filteredReclamos.map((reclamo) => [
      reclamo.location!.lat,
      reclamo.location!.lng,
    ]);
  }, [filteredReclamos]);

  const statistics = useMemo(() => {
    const total = filteredReclamos.length;
    return {
      total,
      abiertos: filteredReclamos.filter((r) => r.status === 'abierto').length,
      enProceso: filteredReclamos.filter((r) =>
        ['derivado', 'en_camino', 'verificado'].includes(r.status),
      ).length,
      cerrados: filteredReclamos.filter((r) => r.status === 'cerrado').length,
    };
  }, [filteredReclamos]);

  const handleToggleTypeVisibility = useCallback((type: string, checked: boolean) => {
    setTypeVisibility((prev) => ({
      ...prev,
      [type]: checked,
    }));
  }, []);

  return (
    <div className="h-full flex flex-col md:flex-row">
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-card p-4 space-y-4 overflow-y-auto max-h-64 md:max-h-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-medium">Mapa de reclamos</h2>
            <p className="text-sm text-muted-foreground">
              Visualiza los reclamos geolocalizados en Moreno
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              void loadReclamos();
            }}
            disabled={isLoading}
            title="Actualizar listado"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="md:hidden">
          <CardHeader>
            <CardTitle className="text-base">Estadisticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="font-medium">{statistics.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div>
                <div className="font-medium text-red-600">
                  {statistics.abiertos}
                </div>
                <div className="text-xs text-muted-foreground">Abiertos</div>
              </div>
              <div>
                <div className="font-medium text-amber-600">
                  {statistics.enProceso}
                </div>
                <div className="text-xs text-muted-foreground">Proceso</div>
              </div>
              <div>
                <div className="font-medium text-gray-600">
                  {statistics.cerrados}
                </div>
                <div className="text-xs text-muted-foreground">Cerrados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-base">Estadisticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">{statistics.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Abiertos:</span>
              <span className="font-medium text-red-600">
                {statistics.abiertos}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>En proceso:</span>
              <span className="font-medium text-amber-600">
                {statistics.enProceso}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cerrados:</span>
              <span className="font-medium text-gray-600">
                {statistics.cerrados}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {typeOptions.length > 0 && (
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle className="text-base">Capas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeOptions.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`layer-${type.value}`}
                    checked={typeVisibility[type.value] ?? true}
                    onCheckedChange={(checked) =>
                      handleToggleTypeVisibility(type.value, checked === true)
                    }
                  />
                  <label
                    htmlFor={`layer-${type.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedReclamo && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reclamo seleccionado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{selectedReclamo.number}</span>
                <Badge className={getStatusColor(selectedReclamo.status)}>
                  {getStatusLabel(selectedReclamo.status)}
                </Badge>
              </div>
              <p className="text-sm">{getTypeLabel(selectedReclamo.type)}</p>
              <p className="text-sm text-muted-foreground">
                {selectedReclamo.address}
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    Denunciante:
                  </span>{' '}
                  {selectedReclamo.denunciante.name}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Fecha:
                  </span>{' '}
                  {formatDate(selectedReclamo.createdAt)}
                </p>
              </div>
              {onViewReclamo && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onViewReclamo(selectedReclamo)}
                >
                  Ver detalles
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {positions.length > 0 && <FitBounds positions={positions} />}

          {filteredReclamos.map((reclamo) => {
            const selected = selectedReclamo?.id === reclamo.id;
            const radius = selected ? 12 : 9;
            const weight = selected ? 3 : 2;

            return (
              <CircleMarker
                key={reclamo.id}
                center={[reclamo.location!.lat, reclamo.location!.lng]}
                radius={radius}
                pathOptions={{
                  color: selected ? '#2563eb' : '#ffffff',
                  weight,
                  fillColor: statusHex(reclamo.status),
                  fillOpacity: 0.9,
                }}
                eventHandlers={{
                  click: () => setSelectedReclamo(reclamo),
                  mouseover: () => setSelectedReclamo(reclamo),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-xs font-medium text-foreground">
                    {reclamo.number}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium text-foreground">
                      {getTypeLabel(reclamo.type)}
                    </div>
                    <div className="text-muted-foreground">
                      {reclamo.address}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusLabel(reclamo.status)} •{' '}
                      {formatDate(reclamo.createdAt)}
                    </div>
                    {onViewReclamo && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => onViewReclamo(reclamo)}
                      >
                        Ver detalles
                      </Button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando mapa...</p>
            </div>
          </div>
        )}

        {filteredReclamos.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">Sin reclamos visibles</h3>
              <p className="text-sm text-muted-foreground">
                Ajusta los filtros para ver reclamos con ubicacion.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
