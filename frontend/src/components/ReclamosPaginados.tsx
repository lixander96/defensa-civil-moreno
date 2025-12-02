import { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Clock, 
  User, 
  FileText, 
  ArrowRight, 
  Calendar,
  X,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Separator } from './ui/separator';
import { mockReclamos, mockUsers } from '../lib/mock-data';
import { formatDate, getStatusColor, getStatusLabel, getPriorityColor, getTypeLabel, getWaitingMinutes, getReclamoTypeInfo } from '../lib/utils';
import { Reclamo } from '../lib/types';

interface ReclamosPaginadosProps {
  onViewReclamo: (reclamo: Reclamo) => void;
}

interface Filters {
  searchTerm: string;
  tipoReclamo: string;
  estado: string;
  fechaDesde: Date | undefined;
  fechaHasta: Date | undefined;
}

const ITEMS_PER_PAGE = 8;

export function ReclamosPaginados({ onViewReclamo }: ReclamosPaginadosProps) {
  const [reclamos] = useState(mockReclamos);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    tipoReclamo: 'all',
    estado: 'all',
    fechaDesde: undefined,
    fechaHasta: undefined
  });

  // Filtrado de reclamos
  const filteredReclamos = useMemo(() => {
    return reclamos.filter(reclamo => {
      // Búsqueda de texto libre
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesText = 
          reclamo.number.toLowerCase().includes(searchLower) ||
          reclamo.denunciante.name.toLowerCase().includes(searchLower) ||
          reclamo.address.toLowerCase().includes(searchLower) ||
          reclamo.description.toLowerCase().includes(searchLower);
        
        if (!matchesText) return false;
      }

      // Filtro por tipo
      if (filters.tipoReclamo !== 'all' && reclamo.type !== filters.tipoReclamo) {
        return false;
      }

      // Filtro por estado
      if (filters.estado !== 'all' && reclamo.status !== filters.estado) {
        return false;
      }

      // Filtro por fecha desde
      if (filters.fechaDesde && reclamo.createdAt < filters.fechaDesde) {
        return false;
      }

      // Filtro por fecha hasta
      if (filters.fechaHasta && reclamo.createdAt > filters.fechaHasta) {
        return false;
      }

      return true;
    });
  }, [reclamos, filters]);

  // Paginación
  const totalPages = Math.ceil(filteredReclamos.length / ITEMS_PER_PAGE);
  const paginatedReclamos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredReclamos.slice(start, end);
  }, [filteredReclamos, currentPage]);

  // Reset page when filters change
  const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      tipoReclamo: 'all',
      estado: 'all',
      fechaDesde: undefined,
      fechaHasta: undefined
    });
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = filters.searchTerm || 
    filters.tipoReclamo !== 'all' || 
    filters.estado !== 'all' || 
    filters.fechaDesde || 
    filters.fechaHasta;

  // Obtener nombre del agente asignado
  const getAgenteName = (assignedTo?: string) => {
    if (!assignedTo) return 'Sin asignar';
    const agent = mockUsers.find(user => user.id === assignedTo);
    return agent ? agent.name : 'Agente desconocido';
  };

  // Obtener tiempo abierto
  const getTimeOpen = (createdAt: Date) => {
    const minutes = getWaitingMinutes(createdAt);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  // Render de tarjeta de reclamo
  const renderReclamoCard = (reclamo: Reclamo) => {
    const typeInfo = getReclamoTypeInfo(reclamo.type);
    const timeOpen = getTimeOpen(reclamo.createdAt);
    const agentName = getAgenteName(reclamo.assignedTo);

    return (
      <Card key={reclamo.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
        <CardContent className="p-4" onClick={() => onViewReclamo(reclamo)}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">#{reclamo.number}</span>
                  <Badge variant="outline" className={getPriorityColor(reclamo.priority)}>
                    {reclamo.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                    <span className="mr-1">{typeInfo.icon}</span>
                    {typeInfo.label}
                  </Badge>
                </div>
              </div>
              <Badge className={getStatusColor(reclamo.status)}>
                {getStatusLabel(reclamo.status)}
              </Badge>
            </div>

            {/* Denunciante */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reclamo.denunciante.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{reclamo.denunciante.phone}</span>
            </div>

            {/* Dirección */}
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground line-clamp-2">{reclamo.address}</span>
            </div>

            {/* Descripción */}
            <p className="text-sm line-clamp-2 text-muted-foreground">
              {reclamo.description}
            </p>

            <Separator />

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                {reclamo.derivedTo && (
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span className="capitalize">{reclamo.derivedTo}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{agentName}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{timeOpen}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render de fila de tabla
  const renderReclamoRow = (reclamo: Reclamo) => {
    const typeInfo = getReclamoTypeInfo(reclamo.type);
    const timeOpen = getTimeOpen(reclamo.createdAt);
    const agentName = getAgenteName(reclamo.assignedTo);

    return (
      <tr 
        key={reclamo.id} 
        className="hover:bg-accent/50 cursor-pointer border-b transition-colors"
        onClick={() => onViewReclamo(reclamo)}
      >
        <td className="p-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">#{reclamo.number}</span>
            <Badge variant="outline" className={`text-xs ${getPriorityColor(reclamo.priority)}`}>
              {reclamo.priority.charAt(0).toUpperCase()}
            </Badge>
          </div>
        </td>
        <td className="p-4">
          <div>
            <div className="font-medium text-sm">{reclamo.denunciante.name}</div>
            <div className="text-xs text-muted-foreground">{reclamo.denunciante.phone}</div>
          </div>
        </td>
        <td className="p-4">
          <div className="text-sm line-clamp-1">{reclamo.address}</div>
        </td>
        <td className="p-4">
          <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
            <span className="mr-1">{typeInfo.icon}</span>
            {typeInfo.label}
          </Badge>
        </td>
        <td className="p-4">
          <div className="text-sm capitalize">{reclamo.derivedTo || 'Sin derivar'}</div>
        </td>
        <td className="p-4">
          <Badge className={getStatusColor(reclamo.status)}>
            {getStatusLabel(reclamo.status)}
          </Badge>
        </td>
        <td className="p-4">
          <div className="text-sm">{timeOpen}</div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Reclamos</h2>
            <p className="text-muted-foreground">Gestión de reclamos de emergencia</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Reclamo
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, denunciante, dirección u observaciones..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="p-4 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Tipo de Reclamo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Reclamo</label>
                  <Select 
                    value={filters.tipoReclamo} 
                    onValueChange={(value) => handleFilterChange({ tipoReclamo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="incendio">🔥 Incendio</SelectItem>
                      <SelectItem value="poste_caido">⚡ Poste Caído</SelectItem>
                      <SelectItem value="fuga_gas">💨 Fuga de Gas</SelectItem>
                      <SelectItem value="inundacion">🌊 Inundación</SelectItem>
                      <SelectItem value="otro">📋 Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Estado</label>
                  <Select 
                    value={filters.estado} 
                    onValueChange={(value) => handleFilterChange({ estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="nuevo">🔴 Nuevo</SelectItem>
                      <SelectItem value="derivado">🟡 Derivado</SelectItem>
                      <SelectItem value="enviado">🟠 Enviado</SelectItem>
                      <SelectItem value="verificado">🟢 Verificado</SelectItem>
                      <SelectItem value="cerrado">⚫ Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha Desde */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Desde</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.fechaDesde ? filters.fechaDesde.toLocaleDateString() : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.fechaDesde}
                        onSelect={(date) => handleFilterChange({ fechaDesde: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fecha Hasta */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha Hasta</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filters.fechaHasta ? filters.fechaHasta.toLocaleDateString() : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.fechaHasta}
                        onSelect={(date) => handleFilterChange({ fechaHasta: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {paginatedReclamos.length} de {filteredReclamos.length} reclamos
            {hasActiveFilters && ` (de ${reclamos.length} totales)`}
          </span>
          <span>Página {currentPage} de {totalPages}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' ? (
          /* Grid View */
          <div className="p-6 overflow-y-auto">
            {paginatedReclamos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedReclamos.map(renderReclamoCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground">No se encontraron reclamos</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay reclamos registrados'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="overflow-y-auto">
            {paginatedReclamos.length > 0 ? (
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium">Número</th>
                    <th className="text-left p-4 font-medium">Denunciante</th>
                    <th className="text-left p-4 font-medium">Dirección</th>
                    <th className="text-left p-4 font-medium">Tipo</th>
                    <th className="text-left p-4 font-medium">Derivado</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReclamos.map(renderReclamoRow)}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground">No se encontraron reclamos</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay reclamos registrados'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}