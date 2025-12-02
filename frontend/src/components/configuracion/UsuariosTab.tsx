import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from '../../lib/api';
import { User } from '../../lib/types';
import { toast } from 'sonner@2.0.3';

type RoleOption = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'AGENT';

interface UsuariosTabProps {
  token: string | null;
  currentUserId: string | null;
}

interface UserFormState {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role: RoleOption;
}

const DEFAULT_FORM_STATE: UserFormState = {
  username: '',
  firstName: '',
  lastName: '',
  password: '',
  role: 'OPERATOR',
};

const ROLE_LABELS: Record<RoleOption, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Coordinador',
  OPERATOR: 'Operador',
  AGENT: 'Agente de Campo',
};

function normalizeRole(role?: string | null): RoleOption {
  const normalized = (role ?? '').toString().trim().toUpperCase();
  switch (normalized) {
    case 'ADMIN':
    case 'ADMINISTRADOR':
      return 'ADMIN';
    case 'MANAGER':
    case 'COORDINADOR':
      return 'MANAGER';
    case 'AGENT':
    case 'AGENTE':
      return 'AGENT';
    default:
      return 'OPERATOR';
  }
}

export function UsuariosTab({ token, currentUserId }: UsuariosTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formState, setFormState] = useState<UserFormState>(DEFAULT_FORM_STATE);

  useEffect(() => {
    if (!token) {
      setUsers([]);
      return;
    }

    let isActive = true;
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await getUsers(token);
        if (!isActive) {
          return;
        }
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users', error);
        if (isActive) {
          toast.error('No se pudieron cargar los usuarios.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isActive = false;
    };
  }, [token]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.username.localeCompare(b.username));
  }, [users]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormState(DEFAULT_FORM_STATE);
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormState({
      username: user.username,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      password: '',
      role: normalizeRole(user.role),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }
    setDialogOpen(false);
    setEditingUser(null);
    setFormState(DEFAULT_FORM_STATE);
  };

  const handleSubmit = async () => {
    if (!token) {
      toast.error('No hay una sesión válida.');
      return;
    }

    if (
      !formState.username.trim() ||
      !formState.firstName.trim() ||
      !formState.lastName.trim()
    ) {
      toast.error('Completa los campos obligatorios.');
      return;
    }

    if (!editingUser && !formState.password.trim()) {
      toast.error('La contraseña es obligatoria para crear un usuario.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingUser) {
        const payload = {
          username: formState.username.trim(),
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          role: formState.role,
          ...(formState.password.trim().length > 0
            ? { password: formState.password.trim() }
            : {}),
        };
        const updated = await updateUser(
          token,
          Number(editingUser.id),
          payload,
        );
        setUsers((prev) =>
          prev.map((user) => (user.id === updated.id ? updated : user)),
        );
        toast.success('Usuario actualizado correctamente.');
      } else {
        const payload = {
          username: formState.username.trim(),
          firstName: formState.firstName.trim(),
          lastName: formState.lastName.trim(),
          password: formState.password.trim(),
          role: formState.role,
        };
        const created = await createUser(token, payload);
        setUsers((prev) => [...prev, created]);
        toast.success('Usuario creado correctamente.');
      }
      closeDialog();
    } catch (error) {
      console.error('Error saving user', error);
      toast.error('No se pudo guardar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (user: User) => {
    if (currentUserId && currentUserId === user.id) {
      toast.error('No podés eliminar tu propio usuario.');
      return;
    }

    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const confirmDelete = async () => {
    if (!token || !userToDelete) {
      toast.error('No hay una sesión válida.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteUser(token, Number(userToDelete.id));
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      toast.success('Usuario eliminado.');
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting user', error);
      toast.error('No se pudo eliminar el usuario.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Iniciá sesión con un usuario administrador para administrar usuarios.
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
            <CardTitle>Gestión de Usuarios</CardTitle>
            <p className="text-sm text-muted-foreground">
              Administrá los usuarios del sistema y sus roles.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando usuarios...
          </div>
        ) : sortedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No se encontraron usuarios registrados.
          </p>
        ) : (
          <div className="space-y-4">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div>
                  <h4>{user.name || user.username}</h4>
                  <p className="text-sm text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {ROLE_LABELS[normalizeRole(user.role)]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => requestDelete(user)}
                    disabled={currentUserId === user.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

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
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Actualizá los datos del usuario seleccionado.'
                : 'Creá un nuevo usuario con acceso al sistema.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formState.firstName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label>Apellido *</Label>
                <Input
                  value={formState.lastName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div>
              <Label>Nombre de Usuario *</Label>
              <Input
                value={formState.username}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                placeholder="jperez"
              />
            </div>
            <div>
              <Label>Contraseña {editingUser ? '(opcional)' : '*'}</Label>
              <Input
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder={
                  editingUser
                    ? 'Dejar vacío para mantener la contraseña actual'
                    : 'Ingresá una contraseña segura'
                }
              />
            </div>
            <div>
              <Label>Rol *</Label>
              <Select
                value={formState.role}
                onValueChange={(value: RoleOption) =>
                  setFormState((prev) => ({
                    ...prev,
                    role: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                  <SelectItem value="AGENT">Agente de Campo</SelectItem>
                  <SelectItem value="MANAGER">Coordinador</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
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
                {editingUser ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => (open ? setDeleteDialogOpen(true) : closeDeleteDialog())}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario perderá el acceso al sistema.
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
    </Card>
  );
}
