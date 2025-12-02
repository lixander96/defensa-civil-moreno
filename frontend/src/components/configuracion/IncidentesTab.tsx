import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Edit, Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import {
  AreaSummary,
  IncidentType,
} from '../../lib/types';
import {
  createIncidentType,
  deleteIncidentType,
  getAreas,
  getComplaintTypes,
  updateIncidentType,
} from '../../lib/api';
import { toast } from 'sonner@2.0.3';

interface IncidentesTabProps {
  token: string | null;
  areasVersion: number;
}

interface IncidentFormState {
  name: string;
  description: string;
  defaultPriority: 'alta' | 'media' | 'baja';
  areaId: string;
  code: string;
  isVisible: boolean;
  autoDerive: boolean;
  icon: string;
  color: string;
}

const DEFAULT_FORM_STATE: IncidentFormState = {
  name: '',
  description: '',
  defaultPriority: 'media',
  areaId: 'none',
  code: '',
  isVisible: true,
  autoDerive: true,
  icon: '',
  color: '',
};

export function IncidentesTab({ token, areasVersion }: IncidentesTabProps) {
  const [incidents, setIncidents] = useState<IncidentType[]>([]);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAreasLoading, setIsAreasLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentType | null>(
    null,
  );
  const [incidentToDelete, setIncidentToDelete] = useState<IncidentType | null>(
    null,
  );
  const [formState, setFormState] =
    useState<IncidentFormState>(DEFAULT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  const loadIncidents = useCallback(async () => {
    if (!token) {
      setIncidents([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getComplaintTypes(token);
      setIncidents(data);
    } catch (error) {
      console.error('Error fetching incidents', error);
      toast.error('No se pudieron cargar los tipos de incidentes.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    if (!token) {
      setAreas([]);
      return;
    }

    let isActive = true;
    const fetchAreas = async () => {
      setIsAreasLoading(true);
      try {
        const data = await getAreas(token);
        if (isActive) {
          setAreas(data);
        }
      } catch (error) {
        console.error('Error fetching areas for incidents', error);
        if (isActive) {
          toast.error('No se pudieron cargar las áreas asociadas.');
        }
      } finally {
        if (isActive) {
          setIsAreasLoading(false);
        }
      }
    };

    fetchAreas();

    return () => {
      isActive = false;
    };
  }, [token, areasVersion]);

  const filteredIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (
        term &&
        !incident.name.toLowerCase().includes(term) &&
        !incident.description.toLowerCase().includes(term) &&
        !incident.id.toLowerCase().includes(term)
      ) {
        return false;
      }

      if (areaFilter !== 'all') {
        if (
          areaFilter === 'none' &&
          incident.derivationAreaId !== 'none'
        ) {
          return false;
        }
        if (
          areaFilter !== 'none' &&
          incident.derivationAreaId !== areaFilter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, searchTerm, areaFilter]);

  const areaNameMap = useMemo(() => {
    const map = new Map<string, string>();
    areas.forEach((area) => {
      map.set(String(area.id), area.name);
    });
    return map;
  }, [areas]);

  const openCreateDialog = () => {
    setEditingIncident(null);
    setFormState(DEFAULT_FORM_STATE);
    setDialogOpen(true);
  };

  const openEditDialog = (incident: IncidentType) => {
    setEditingIncident(incident);
    setFormState({
      name: incident.name,
      description: incident.description,
      defaultPriority: incident.priority,
      areaId:
        incident.derivationAreaId && incident.derivationAreaId !== 'none'
          ? incident.derivationAreaId
          : 'none',
      code: incident.id,
      isVisible: incident.active,
      autoDerive: incident.autoDerive,
      icon: incident.icon ?? '',
      color: incident.color ?? '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }
    setDialogOpen(false);
    setEditingIncident(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }

    if (!formState.name.trim() || !formState.description.trim()) {
      toast.error('Completá los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    const basePayload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      defaultPriority: formState.defaultPriority,
      areaId:
        formState.areaId === 'none' || formState.areaId === ''
          ? null
          : Number(formState.areaId),
      code: formState.code.trim() || undefined,
      isVisible: formState.isVisible,
      autoDerive: formState.autoDerive,
      icon: formState.icon.trim() || undefined,
      color: formState.color.trim() || undefined,
    };

    try {
      if (editingIncident) {
        if (typeof editingIncident.backendId !== 'number') {
          toast.error(
            'No es posible actualizar este incidente porque no tiene identificador.',
          );
          return;
        }

        const updated = await updateIncidentType(
          token,
          editingIncident.backendId,
          basePayload,
        );
        setIncidents((prev) =>
          prev.map((incident) =>
            incident.backendId === updated.backendId ? updated : incident,
          ),
        );
        toast.success('Tipo de incidente actualizado.');
      } else {
        const created = await createIncidentType(token, basePayload);
        setIncidents((prev) => [...prev, created]);
        toast.success('Tipo de incidente creado.');
      }
      closeDialog();
    } catch (error) {
      console.error('Error saving incident', error);
      toast.error('No se pudo guardar el tipo de incidente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (incident: IncidentType) => {
    setIncidentToDelete(incident);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }
    setIncidentToDelete(null);
    setDeleteDialogOpen(false);
  };

  const confirmDelete = async () => {
    if (!token || !incidentToDelete) {
      toast.error('No hay una sesión válida.');
      return;
    }
    if (typeof incidentToDelete.backendId !== 'number') {
      toast.error(
        'No es posible eliminar este incidente porque no tiene identificador.',
      );
      return;
    }

    setIsDeleting(true);
    try {
      await deleteIncidentType(token, incidentToDelete.backendId);
      setIncidents((prev) =>
        prev.filter(
          (incident) => incident.backendId !== incidentToDelete.backendId,
        ),
      );
      toast.success('Tipo de incidente eliminado.');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting incident', error);
      toast.error('No se pudo eliminar el tipo de incidente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = async (incident: IncidentType) => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }
    if (typeof incident.backendId !== 'number') {
      toast.error('No se pudo actualizar la visibilidad.');
      return;
    }

    try {
      const updated = await updateIncidentType(token, incident.backendId, {
        isVisible: !incident.active,
      });
      setIncidents((prev) =>
        prev.map((item) =>
          item.backendId === updated.backendId ? updated : item,
        ),
      );
      toast.success(
        `Incidente ${
          updated.active ? 'habilitado' : 'deshabilitado'
        } correctamente.`,
      );
    } catch (error) {
      console.error('Error toggling incident visibility', error);
      toast.error('No se pudo actualizar la visibilidad.');
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Incidentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Iniciá sesión con un usuario autorizado para gestionar incidentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Tipos de Incidentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Administrá los tipos disponibles y su asignación por área.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-56"
              />
              <Select
                value={areaFilter}
                onValueChange={(value) => setAreaFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  <SelectItem value="none">Sin área asignada</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={String(area.id)}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tipo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando tipos de incidentes...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8" />
              <div>
                <p className="font-medium">
                  No se encontraron tipos de incidentes
                </p>
                <p className="text-sm">
                  Ajustá los filtros o creá un nuevo tipo.
                </p>
              </div>
            </div>
          ) : (
            filteredIncidents
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((incident) => (
                <div
                  key={incident.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{incident.name}</h4>
                      <Badge variant="outline">{incident.id}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {incident.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        Prioridad {incident.priority}
                      </Badge>
                      <Badge variant="outline">
                        {incident.derivationAreaId === 'none'
                          ? 'Sin área asignada'
                          : areaNameMap.get(incident.derivationAreaId) ??
                            `Área #${incident.derivationAreaId}`}
                      </Badge>
                      {incident.autoDerive && (
                        <Badge variant="outline">Autoderivación activa</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={incident.active}
                      onCheckedChange={() => toggleVisibility(incident)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(incident)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => requestDelete(incident)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIncident ? 'Editar tipo de incidente' : 'Nuevo tipo de incidente'}
            </DialogTitle>
            <DialogDescription>
              Completá los datos para definir cómo se gestionará este tipo de incidente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Incendio"
                />
              </div>
              <div className="space-y-2">
                <Label>Código (opcional)</Label>
                <Input
                  value={formState.code}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  placeholder="INC-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Describe cuándo se utiliza este tipo de incidente."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Prioridad por defecto</Label>
                <Select
                  value={formState.defaultPriority}
                  onValueChange={(value: 'alta' | 'media' | 'baja') =>
                    setFormState((prev) => ({
                      ...prev,
                      defaultPriority: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área de derivación</Label>
                <Select
                  value={formState.areaId}
                  onValueChange={(value) =>
                    setFormState((prev) => ({
                      ...prev,
                      areaId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin área asignada</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={String(area.id)}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isAreasLoading && (
                  <p className="text-xs text-muted-foreground">
                    Actualizando listado de áreas...
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Icono (opcional)</Label>
                <Input
                  value={formState.icon}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      icon: event.target.value,
                    }))
                  }
                  placeholder="mdi-fire"
                />
              </div>
              <div className="space-y-2">
                <Label>Color (opcional)</Label>
                <Input
                  value={formState.color}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      color: event.target.value,
                    }))
                  }
                  placeholder="#FF5733"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Visible</Label>
                  <p className="text-xs text-muted-foreground">
                    Controla si el tipo está disponible para su selección.
                  </p>
                </div>
                <Switch
                  checked={formState.isVisible}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      isVisible: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Autoderivar</Label>
                  <p className="text-xs text-muted-foreground">
                    Derivá automáticamente a su área al crear un reclamo.
                  </p>
                </div>
                <Switch
                  checked={formState.autoDerive}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({
                      ...prev,
                      autoDerive: checked,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingIncident ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) =>
          open ? setDeleteDialogOpen(true) : closeDeleteDialog()
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tipo de incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los reclamos existentes conservarán la información previa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
