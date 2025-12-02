import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { Switch } from '../ui/switch';
import {
  AreaSummary,
} from '../../lib/types';
import {
  createArea,
  deleteArea,
  getAreas,
  updateArea,
} from '../../lib/api';
import { toast } from 'sonner@2.0.3';

interface AreasTabProps {
  token: string | null;
  onAreasChanged?: () => void;
}

interface AreaFormState {
  name: string;
  isVisible: boolean;
}

const DEFAULT_FORM_STATE: AreaFormState = {
  name: '',
  isVisible: true,
};

export function AreasTab({ token, onAreasChanged }: AreasTabProps) {
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaSummary | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<AreaSummary | null>(null);
  const [formState, setFormState] = useState<AreaFormState>(DEFAULT_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const loadAreas = useCallback(async () => {
    if (!token) {
      setAreas([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getAreas(token);
      setAreas(data);
    } catch (error) {
      console.error('Error fetching areas', error);
      toast.error('No se pudieron cargar las áreas.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const filteredAreas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return areas;
    }
    return areas.filter((area) =>
      area.name.toLowerCase().includes(term) ||
      (area.areaType?.name?.toLowerCase() ?? '').includes(term),
    );
  }, [areas, search]);

  const openCreateDialog = () => {
    setEditingArea(null);
    setFormState(DEFAULT_FORM_STATE);
    setDialogOpen(true);
  };

  const openEditDialog = (area: AreaSummary) => {
    setEditingArea(area);
    setFormState({
      name: area.name,
      isVisible: area.isVisible,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }
    setDialogOpen(false);
    setEditingArea(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }
    if (!formState.name.trim()) {
      toast.error('Ingresá un nombre para el área.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingArea) {
        const updated = await updateArea(token, editingArea.id, {
          name: formState.name.trim(),
          isVisible: formState.isVisible,
        });
        setAreas((prev) =>
          prev.map((area) => (area.id === updated.id ? updated : area)),
        );
        toast.success('Área actualizada correctamente.');
      } else {
        const created = await createArea(token, {
          name: formState.name.trim(),
          isVisible: formState.isVisible,
        });
        setAreas((prev) => [...prev, created]);
        toast.success('Área creada correctamente.');
      }
      onAreasChanged?.();
      closeDialog();
    } catch (error) {
      console.error('Error saving area', error);
      toast.error('No se pudo guardar el área.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (area: AreaSummary) => {
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  const confirmDelete = async () => {
    if (!token || !areaToDelete) {
      toast.error('No hay una sesión válida.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteArea(token, areaToDelete.id);
      setAreas((prev) => prev.filter((area) => area.id !== areaToDelete.id));
      toast.success('Área eliminada.');
      onAreasChanged?.();
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting area', error);
      toast.error('No se pudo eliminar el área.');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleVisibility = async (area: AreaSummary) => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }

    try {
      const updated = await updateArea(token, area.id, {
        isVisible: !area.isVisible,
      });
      setAreas((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        `Área ${updated.isVisible ? 'activada' : 'desactivada'} correctamente.`,
      );
      onAreasChanged?.();
    } catch (error) {
      console.error('Error toggling area visibility', error);
      toast.error('No se pudo actualizar la visibilidad.');
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Áreas de Derivación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Iniciá sesión con un usuario con permisos para administrar áreas.
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
              <CardTitle>Áreas de Derivación</CardTitle>
              <p className="text-sm text-muted-foreground">
                Administrá las áreas disponibles para derivar incidentes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar área..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-48"
              />
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Área
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando áreas...
            </div>
          ) : filteredAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No se encontraron áreas con los criterios seleccionados.
            </p>
          ) : (
            filteredAreas.map((area) => (
              <div
                key={area.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <h4 className="font-medium">{area.name}</h4>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      {area.isVisible ? 'Visible' : 'Oculta'}
                    </Badge>
                    {area.areaType && (
                      <Badge variant="secondary">
                        {area.areaType.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={area.isVisible}
                    onCheckedChange={() => toggleVisibility(area)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => requestDelete(area)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? 'Editar Área' : 'Nueva Área'}
            </DialogTitle>
            <DialogDescription>
              {editingArea
                ? 'Modificá los datos del área seleccionada.'
                : 'Creá una nueva área de derivación.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Zona Norte"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Área visible</Label>
                <p className="text-xs text-muted-foreground">
                  Controla si el área está disponible para asignaciones.
                </p>
              </div>
              <Switch
                checked={formState.isVisible}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, isVisible: checked }))
                }
              />
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
                {editingArea ? 'Actualizar' : 'Crear'}
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
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer y eliminará el área seleccionada.
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
