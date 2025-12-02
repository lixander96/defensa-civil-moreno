import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Clock,
  MapPin,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { CreateReclamoForm } from './CreateReclamoForm';
import { getAreas, getComplaintTypes, listComplaints } from '../lib/api';
import { DerivationArea, IncidentType, Reclamo } from '../lib/types';
import {
  formatDate,
  getPriorityColor,
  getReclamoTypeInfo,
  getStatusColor,
  getStatusLabel,
  getWaitingMinutes,
} from '../lib/utils';

interface ReclamosProps {
  token: string | null;
  onViewReclamo: (reclamo: Reclamo) => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'derivado', label: 'Derivado' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'verificado', label: 'Verificado' },
  { value: 'cerrado', label: 'Cerrado' },
];

const ITEMS_PER_PAGE = 8;

export function Reclamos({ token, onViewReclamo }: ReclamosProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [complaints, setComplaints] = useState<Reclamo[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [derivationAreas, setDerivationAreas] = useState<DerivationArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const loadCatalogs = useCallback(async () => {
    if (!token) {
      setIncidentTypes([]);
      setDerivationAreas([]);
      return;
    }

    try {
      const [typesResponse, areasResponse] = await Promise.all([
        getComplaintTypes(token),
        getAreas(token),
      ]);

      setIncidentTypes(typesResponse);
      setDerivationAreas(
        areasResponse.map((area) => ({
          id: String(area.id),
          name: area.name,
          description: '',
          whatsappContacts: [],
          active: area.isVisible ?? true,
          color: '',
          icon: '',
        })),
      );
    } catch (error) {
      setErrorMessage('No se pudieron cargar los catalogos');
    }
  }, [token]);

  const loadComplaints = useCallback(async () => {
    if (!token) {
      setComplaints([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await listComplaints(token);
      setComplaints(data);
    } catch (error) {
      setErrorMessage('No se pudieron obtener los reclamos');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const derivationOptions = useMemo(() => {
    return derivationAreas.map((area) => ({
      value: area.id,
      label: area.name,
    }));
  }, [derivationAreas]);

  const derivationLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    derivationAreas.forEach((area) => {
      map[area.id] = area.name;
    });
    return map;
  }, [derivationAreas]);

  const typeOptions = useMemo(() => {
    return incidentTypes.map((type) => ({
      value: type.id,
      label: type.name,
    }));
  }, [incidentTypes]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        search.trim().length === 0 ||
        complaint.number.toLowerCase().includes(search.toLowerCase()) ||
        complaint.denunciante.name.toLowerCase().includes(search.toLowerCase()) ||
        complaint.address.toLowerCase().includes(search.toLowerCase()) ||
        complaint.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) {
        return false;
      }

      if (statusFilter !== 'all' && complaint.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && complaint.type !== typeFilter) {
        return false;
      }

      if (
        areaFilter !== 'all' &&
        complaint.derivedTo &&
        complaint.derivedTo !== areaFilter
      ) {
        return false;
      }

      return true;
    });
  }, [complaints, search, statusFilter, typeFilter, areaFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter, areaFilter]);

  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredComplaints.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredComplaints, currentPage]);

  const handleCreated = (newComplaint: Reclamo) => {
    setComplaints((prev) => [newComplaint, ...prev]);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Reclamos</h2>
            <p className="text-sm text-muted-foreground">
              Consulta, crea y gestiona los reclamos registrados en el sistema.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              aria-label="Ver en grilla"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              aria-label="Ver en lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <CreateReclamoForm
              token={token}
              incidentTypes={incidentTypes}
              derivationAreas={derivationAreas}
              onReclamoCreated={handleCreated}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-6 py-4">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por numero, denunciante o direccion"
                  className="pl-9"
                />
              </div>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Derivacion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las areas</SelectItem>
                  {derivationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-muted-foreground">Cargando reclamos...</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {paginatedComplaints.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No hay reclamos que coincidan con el filtro actual.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedComplaints.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    incidentTypes={incidentTypes}
                    areaLabels={derivationLabelMap}
                    onOpen={() => onViewReclamo(complaint)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedComplaints.map((complaint) => (
                  <ComplaintRow
                    key={complaint.id}
                    complaint={complaint}
                    incidentTypes={incidentTypes}
                    areaLabels={derivationLabelMap}
                    onOpen={() => onViewReclamo(complaint)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t bg-card px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Pagina {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComplaintPresentationProps {
  complaint: Reclamo;
  incidentTypes: IncidentType[];
  areaLabels: Record<string, string>;
  onOpen: () => void;
}

function ComplaintCard({
  complaint,
  incidentTypes,
  areaLabels,
  onOpen,
}: ComplaintPresentationProps) {
  const typeInfo = resolveTypeInfo(complaint, incidentTypes);
  const waitingMinutes = getWaitingMinutes(complaint.createdAt);

  return (
    <Card className="cursor-pointer transition hover:shadow-lg" onClick={onOpen}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">#{complaint.number}</span>
              <Badge
                variant="outline"
                className={getPriorityColor(complaint.priority)}
              >
                {complaint.priority}
              </Badge>
            </div>
            <Badge variant="secondary" className="flex w-fit items-center gap-1">
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
            </Badge>
          </div>
          <Badge className={getStatusColor(complaint.status)}>
            {getStatusLabel(complaint.status)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-medium">{complaint.denunciante.name}</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{complaint.address}</span>
          </div>
          <p className="line-clamp-2 text-muted-foreground">{complaint.description}</p>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {complaint.derivedTo && complaint.derivedTo !== 'none' && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {areaLabels[complaint.derivedTo] ?? complaint.derivedTo}
              </span>
            )}
            {complaint.assignedToName && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {complaint.assignedToName}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {waitingMinutes} min
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintRow({
  complaint,
  incidentTypes,
  areaLabels,
  onOpen,
}: ComplaintPresentationProps) {
  const typeInfo = resolveTypeInfo(complaint, incidentTypes);
  const waitingMinutes = getWaitingMinutes(complaint.createdAt);

  return (
    <Card className="cursor-pointer transition hover:shadow-lg" onClick={onOpen}>
      <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm md:flex-nowrap">
        <div className="min-w-[180px]">
          <div className="font-semibold">#{complaint.number}</div>
          <div className="text-xs text-muted-foreground">
            {formatDate(complaint.createdAt)}
          </div>
        </div>

        <div className="flex-1">
          <div className="font-medium">{complaint.denunciante.name}</div>
          <div className="text-muted-foreground">{complaint.denunciante.phone}</div>
        </div>

        <div className="hidden flex-1 flex-col md:flex">
          <span className="font-medium">{typeInfo.label}</span>
          <span className="text-xs text-muted-foreground line-clamp-2">
            {complaint.description}
          </span>
          {complaint.derivedTo && complaint.derivedTo !== 'none' ? (
            <span className="text-xs text-muted-foreground">
              Derivado a: {areaLabels[complaint.derivedTo] ?? complaint.derivedTo}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(complaint.status)}>
            {getStatusLabel(complaint.status)}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
            {complaint.priority}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          {waitingMinutes} min
        </div>
      </CardContent>
    </Card>
  );
}

function resolveTypeInfo(complaint: Reclamo, types: IncidentType[]) {
  if (complaint.typeInfo) {
    return {
      label: complaint.typeInfo.name,
      icon: complaint.typeInfo.icon,
      color: complaint.typeInfo.color,
    };
  }

  const fromCatalog = types.find((type) => type.id === complaint.type);
  if (fromCatalog) {
    return {
      label: fromCatalog.name,
      icon: fromCatalog.icon,
      color: fromCatalog.color,
    };
  }

  return getReclamoTypeInfo(complaint.type);
}
