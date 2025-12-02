import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, FileText, MapPin, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { DerivationArea, IncidentType, Reclamo } from '../lib/types';
import {
  ApiError,
  CreateComplaintPayload,
  createComplaint,
} from '../lib/api';
import { LocationPicker } from './LocationPicker';
import { geocodeAddress } from '../lib/geocoding';

type PriorityValue = 'alta' | 'media' | 'baja';

interface CreateReclamoFormProps {
  token: string | null;
  incidentTypes: IncidentType[];
  derivationAreas: DerivationArea[];
  onReclamoCreated?: (reclamo: Reclamo) => void;
  onCancel?: () => void;
  prefilledData?: {
    denuncianteName?: string;
    denunciantePhone?: string;
    conversationId?: string;
  };
}

interface FormState {
  type: string;
  description: string;
  denuncianteName: string;
  denunciantePhone: string;
  address: string;
  priority: PriorityValue;
  derivedTo: string;
  locationLat: string;
  locationLng: string;
  attachments: File[];
}

const emptyForm: FormState = {
  type: '',
  description: '',
  denuncianteName: '',
  denunciantePhone: '',
  address: '',
  priority: 'media',
  derivedTo: 'none',
  locationLat: '',
  locationLng: '',
  attachments: [],
};

const priorities: Array<{ value: PriorityValue; label: string; helper: string }> =
  [
    { value: 'alta', label: 'Alta', helper: 'Riesgo alto - respuesta inmediata' },
    { value: 'media', label: 'Media', helper: 'Atender en las proximas horas' },
    { value: 'baja', label: 'Baja', helper: 'Seguimiento programado' },
  ];

export function CreateReclamoForm({
  token,
  incidentTypes,
  derivationAreas,
  onReclamoCreated,
  onCancel,
  prefilledData,
}: CreateReclamoFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    denuncianteName: prefilledData?.denuncianteName ?? '',
    denunciantePhone: prefilledData?.denunciantePhone ?? '',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'auto' | 'manual' | null>(null);

  const reclamoTypes = useMemo(() => {
    return incidentTypes
      .filter((type) => type.active)
      .map((type) => ({
        value: type.id,
        label: type.name,
        description: type.description,
        color: type.color,
        icon: type.icon,
        backendId: type.backendId,
        autoDeriveTo: type.autoDerive ? type.derivationAreaId : 'none',
        priority: type.priority,
      }));
  }, [incidentTypes]);

  const derivationOptions = useMemo(() => {
    const base = [{ value: 'none', label: 'Sin derivar' }];
    const dynamic = derivationAreas
      .filter((area) => area.active)
      .map((area) => ({ value: area.id, label: area.name }));
    return [...base, ...dynamic];
  }, [derivationAreas]);

  const derivationLabels = useMemo(() => {
    const map: Record<string, string> = { none: 'Sin derivar' };
    derivationAreas.forEach((area) => {
      map[area.id] = area.name;
    });
    return map;
  }, [derivationAreas]);

  const selectedType = reclamoTypes.find((type) => type.value === form.type);
  const locationValue = useMemo(() => {
    const lat = Number.parseFloat(form.locationLat);
    const lng = Number.parseFloat(form.locationLng);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }

    return null;
  }, [form.locationLat, form.locationLng]);
  const normalizedAddress = form.address.trim();

  const setLocationValue = useCallback((coords: { lat: number; lng: number }) => {
    setForm((prev) => ({
      ...prev,
      locationLat: coords.lat.toFixed(6),
      locationLng: coords.lng.toFixed(6),
    }));
  }, []);

  const geocodeFromAddress = useCallback(
    async (address: string, options?: { silent?: boolean }) => {
      const query = address.trim();
      if (query.length < 5) {
        if (!options?.silent) {
          setGeocodingError('Ingresa una direccion mas detallada para ubicarla en el mapa.');
        }
        return;
      }

      setGeocoding(true);
      if (!options?.silent) {
        setGeocodingError(null);
      }
      setLastGeocodedAddress(query);

      try {
        const result = await geocodeAddress(query);
        if (!result) {
          if (!options?.silent) {
            setGeocodingError('No se encontro una ubicacion para la direccion ingresada.');
            toast.error('No se pudo localizar la direccion en el mapa');
          }
          return;
        }

        setLocationValue({ lat: result.lat, lng: result.lng });
        setLocationSource('auto');
        setGeocodingError(null);

        if (!options?.silent) {
          toast.success('Ubicacion actualizada en el mapa');
        }
      } catch (error) {
        console.error('Failed to geocode address', error);
        if (!options?.silent) {
          setGeocodingError('No se pudo obtener la ubicacion a partir de la direccion.');
          toast.error('Error al obtener la ubicacion desde la direccion');
        }
      } finally {
        setGeocoding(false);
      }
    },
    [setLocationValue],
  );

  useEffect(() => {
    if (!normalizedAddress) {
      return;
    }

    if (locationSource === 'manual' && locationValue) {
      return;
    }

    if (normalizedAddress === lastGeocodedAddress) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void geocodeFromAddress(normalizedAddress, { silent: true });
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    normalizedAddress,
    geocodeFromAddress,
    lastGeocodedAddress,
    locationSource,
    locationValue,
  ]);

  const handleManualLocationChange = useCallback(
    (coords: { lat: number; lng: number }) => {
      setLocationValue(coords);
      setLocationSource('manual');
      setGeocodingError(null);
    },
    [setLocationValue],
  );

  const selectedPriority = priorities.find(
    (priority) => priority.value === form.priority,
  );

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === 'address') {
      setLastGeocodedAddress(null);
      setGeocodingError(null);
      if (locationSource !== 'auto') {
        setLocationSource(null);
      }
    }

    if (key === 'type') {
      const nextType = reclamoTypes.find((item) => item.value === value);
      if (nextType) {
        setForm((prev) => ({
          ...prev,
          type: nextType.value,
          derivedTo: nextType.autoDeriveTo,
          priority: nextType.priority ?? prev.priority,
        }));
      }
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const valid = Array.from(files).filter((file) => {
      const allowed = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
      ]);

      if (!allowed.has(file.type)) {
        toast.error(`Tipo de archivo no permitido: ${file.name}`);
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Archivo muy grande: ${file.name}. Maximo 5MB.`);
        return false;
      }

      return true;
    });

    if (valid.length === 0) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...valid],
    }));
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      denuncianteName: prefilledData?.denuncianteName ?? '',
      denunciantePhone: prefilledData?.denunciantePhone ?? '',
    });
    setGeocoding(false);
    setGeocodingError(null);
    setLastGeocodedAddress(null);
    setLocationSource(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.type ||
      !form.description ||
      !form.denuncianteName ||
      !form.denunciantePhone ||
      !form.address
    ) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (!token) {
      toast.error('No se encontro una sesion valida');
      return;
    }

    const typeInfo = reclamoTypes.find((item) => item.value === form.type);
    if (!typeInfo || !typeInfo.backendId) {
      toast.error('No se pudo identificar el tipo seleccionado');
      return;
    }

    const payload: CreateComplaintPayload = {
      typeId: typeInfo.backendId,
      description: form.description.trim(),
      complainantName: form.denuncianteName.trim(),
      complainantPhone: form.denunciantePhone.trim(),
      address: form.address.trim(),
      priority: form.priority,
      derivedTo:
        form.derivedTo && form.derivedTo !== 'none'
          ? form.derivedTo.trim()
          : undefined,
      attachments: form.attachments.map((file) => file.name),
    };

    const hasLocation =
      form.locationLat.trim().length > 0 && form.locationLng.trim().length > 0;

    if (hasLocation) {
      const lat = Number(form.locationLat);
      const lng = Number(form.locationLng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        payload.location = { lat, lng };
      }
    }

    setIsSubmitting(true);
    try {
      const created = await createComplaint(token, payload);
      toast.success('Reclamo creado exitosamente', {
        description: `Numero de reclamo: #${created.number}`,
      });
      onReclamoCreated?.(created);
      resetForm();
      setOpen(false);
    } catch (error) {
      if (error instanceof ApiError) {
        let detail: string | undefined;
        if (typeof error.data === 'string') {
          detail = error.data;
        } else if (
          error.data &&
          typeof error.data === 'object' &&
          Array.isArray((error.data as { message?: string[] }).message)
        ) {
          detail = (error.data as { message: string[] }).message.join('. ');
        }

        toast.error('No se pudo crear el reclamo', {
          description: detail,
        });
      } else {
        toast.error('No se pudo crear el reclamo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
      onCancel?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo reclamo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear reclamo
          </DialogTitle>
          <DialogDescription>
            Carga los datos del incidente para registrarlo en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-2">
                <Label>Tipo *</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => updateForm('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reclamoTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType && (
                  <Badge variant="secondary" className="w-fit">
                    {selectedType.icon} {selectedType.label}
                  </Badge>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descripcion *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="Describe la situacion con el mayor detalle posible"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="denuncianteName">Denunciante *</Label>
                <Input
                  id="denuncianteName"
                  value={form.denuncianteName}
                  onChange={(event) => updateForm('denuncianteName', event.target.value)}
                  placeholder="Nombre y apellido"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="denunciantePhone">Telefono *</Label>
                <Input
                  id="denunciantePhone"
                  value={form.denunciantePhone}
                  onChange={(event) => updateForm('denunciantePhone', event.target.value)}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Direccion *</Label>
                <div className="space-y-2">
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(event) => updateForm('address', event.target.value)}
                    placeholder="Calle y altura, localidad"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={geocoding || normalizedAddress.length === 0}
                      onClick={() => {
                        void geocodeFromAddress(normalizedAddress);
                      }}
                    >
                      {geocoding ? (
                        <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
                      ) : (
                        <MapPin className="mr-2 h-3.5 w-3.5" />
                      )}
                      {geocoding ? 'Buscando...' : 'Ubicar en el mapa'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Se ubicara automaticamente la direccion ingresada. Puedes ajustar la posicion manualmente.
                    </span>
                  </div>
                  {geocodingError && (
                    <p className="text-xs text-destructive">{geocodingError}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ubicacion
                </Label>
                <LocationPicker
                  value={locationValue}
                  onChange={handleManualLocationChange}
                  onManualChange={() => setLocationSource('manual')}
                  disabled={isSubmitting}
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    id="locationLat"
                    type="text"
                    value={form.locationLat}
                    readOnly
                    placeholder="Latitud (ej: -34.650600)"
                  />
                  <Input
                    id="locationLng"
                    type="text"
                    value={form.locationLng}
                    readOnly
                    placeholder="Longitud (ej: -58.783100)"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Haz clic en el mapa o arrastra el marcador para ajustar la ubicacion.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Prioridad *
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(value: PriorityValue) => updateForm('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{priority.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {priority.helper}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPriority && (
                  <Badge variant="outline" className="w-fit">
                    {selectedPriority.label}
                  </Badge>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Derivar a</Label>
                <Select
                  value={form.derivedTo}
                  onValueChange={(value) => updateForm('derivedTo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar derivacion (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {derivationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.derivedTo !== 'none' && (
                  <p className="text-xs text-muted-foreground">
                    Se derivara a:{' '}
                    {derivationLabels[form.derivedTo] ?? form.derivedTo}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Archivos adjuntos
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="fileUpload"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.txt"
                    className="hidden"
                    onChange={(event) => handleFileUpload(event.target.files)}
                  />
                  <Label
                    htmlFor="fileUpload"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-muted-foreground px-3 py-2 text-sm hover:bg-muted/50"
                  >
                    <Upload className="h-4 w-4" />
                    Seleccionar archivos
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, PDF o TXT. Maximo 5MB cada uno.
                  </span>
                </div>

                {form.attachments.length > 0 && (
                  <div className="space-y-2">
                    {form.attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-lg bg-muted/30 p-2 text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
                onCancel?.();
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear reclamo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
