import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  Filter,
  MapPin,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { getComplaintReportSummary, ComplaintReportSummaryParams } from '../lib/api';
import { ReportHeatmapRow, ReportSummary } from '../lib/types';

interface ReportesProps {
  token: string | null;
}

const DATE_RANGE_OPTIONS = [
  { value: '24h', label: 'Ultimas 24 horas' },
  { value: '7days', label: 'Ultimos 7 dias' },
  { value: '30days', label: 'Ultimos 30 dias' },
  { value: '3months', label: 'Ultimos 3 meses' },
  { value: 'year', label: 'Este ano' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'abierto', label: 'Abierto' },
  { value: 'derivado', label: 'Derivado' },
  { value: 'en_camino', label: 'En camino' },
  { value: 'verificado', label: 'Verificado' },
  { value: 'cerrado', label: 'Cerrado' },
] as const;

const METRIC_OPTIONS = [
  { value: 'overview', label: 'Resumen general' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'geographic', label: 'Geografico' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  abierto: 'Abierto',
  derivado: 'Derivado',
  en_camino: 'En camino',
  verificado: 'Verificado',
  cerrado: 'Cerrado',
};

const STATUS_COLORS: Record<string, string> = {
  abierto: '#dc2626',
  derivado: '#f97316',
  en_camino: '#2563eb',
  verificado: '#16a34a',
  cerrado: '#6b7280',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  abierto: 'bg-red-500',
  derivado: 'bg-orange-500',
  en_camino: 'bg-blue-500',
  verificado: 'bg-green-500',
  cerrado: 'bg-gray-500',
};

const COLOR_PALETTE = [
  '#2563eb',
  '#dc2626',
  '#f97316',
  '#16a34a',
  '#7c3aed',
  '#0ea5e9',
  '#facc15',
  '#ec4899',
];

type DateRangePreset = (typeof DATE_RANGE_OPTIONS)[number]['value'];

function computeRange(preset: DateRangePreset): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);

  switch (preset) {
    case '24h':
      from.setHours(from.getHours() - 24, 0, 0, 0);
      break;
    case '7days':
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    case '30days':
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      break;
    case '3months':
      from.setMonth(from.getMonth() - 3);
      from.setHours(0, 0, 0, 0);
      break;
    case 'year':
      from.setFullYear(from.getFullYear(), 0, 1);
      from.setHours(0, 0, 0, 0);
      break;
    default:
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
  }

  return { from, to };
}

function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Sin datos';
  }
  return `${value.toFixed(1)} min`;
}

function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Sin datos';
  }
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  return value.toLocaleString('es-AR');
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'No se pudieron cargar los reportes.';
}

function trendLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
  });
}

function collectAreas(rows: ReportHeatmapRow[]): Array<{ areaId: number | null; areaName: string }> {
  const map = new Map<number | null, string>();
  rows.forEach((row) => {
    row.areas.forEach((area) => {
      if (!map.has(area.areaId)) {
        map.set(area.areaId, area.areaName);
      }
    });
  });

  if (map.size === 0) {
    map.set(null, 'Sin area');
  }

  return Array.from(map.entries()).map(([areaId, areaName]) => ({ areaId, areaName }));
}

function resolveHeatCellColor(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return 'bg-muted';
  }

  const intensity = value / maxValue;

  if (intensity >= 0.8) return 'bg-red-500';
  if (intensity >= 0.6) return 'bg-orange-500';
  if (intensity >= 0.4) return 'bg-yellow-500';
  if (intensity >= 0.25) return 'bg-green-500';
  if (intensity >= 0.1) return 'bg-green-200 dark:bg-green-900/60';
  return 'bg-muted';
}

export function Reportes({ token }: ReportesProps) {
  const [dateRange, setDateRange] = useState<DateRangePreset>('7days');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => computeRange(dateRange), [dateRange]);

  const statusParam = useMemo(
    () => (estadoFilter !== 'all' ? estadoFilter : undefined),
    [estadoFilter],
  );

  const typeParam = useMemo(() => {
    if (tipoFilter === 'all' || tipoFilter === 'null') {
      return undefined;
    }
    const parsed = Number.parseInt(tipoFilter, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [tipoFilter]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setSummary(null);
      return;
    }

    const params: ComplaintReportSummaryParams = {
      from: range.from,
      to: range.to,
      status: statusParam,
      typeId: typeParam,
    };

    setLoading(true);
    setError(null);

    try {
      const data = await getComplaintReportSummary(token, params);
      setSummary(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token, range.from, range.to, statusParam, typeParam]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const typeOptions = useMemo(() => {
    if (!summary) {
      return [];
    }

    const map = new Map<string, string>();
    summary.byType.forEach((item) => {
      if (item.typeId !== null) {
        map.set(String(item.typeId), item.typeName);
      }
    });

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [summary]);

  const incidentsByType = summary?.byType ?? [];
  const performanceData = summary?.performanceByType ?? [];
  const statusData = summary?.byStatus ?? [];
  const trendData = summary?.weeklyTrend ?? [];
  const heatmapData = summary?.heatmap ?? [];
  const areaColumns = useMemo(() => collectAreas(heatmapData), [heatmapData]);

  const hasData = (summary?.totals.totalComplaints ?? 0) > 0;
  const lastUpdatedLabel = summary
    ? new Date(summary.generatedAt).toLocaleString('es-AR')
    : 'Sin datos';

  const kpiItems = [
    {
      title: 'Tiempo promedio derivacion',
      value: formatMinutes(summary?.timeMetrics.averageAssignmentMinutes),
      subtitle: 'Desde la creacion hasta derivar',
      icon: Clock,
      color: '#2563eb',
    },
    {
      title: 'Tiempo promedio llegada',
      value: formatMinutes(summary?.timeMetrics.averageArrivalMinutes),
      subtitle: 'Desde la derivacion hasta en camino/verificado',
      icon: TrendingUp,
      color: '#0ea5e9',
    },
    {
      title: 'Tiempo promedio resolucion',
      value: formatMinutes(summary?.timeMetrics.averageResolutionMinutes),
      subtitle: 'Desde la creacion hasta cierre/verificacion',
      icon: CheckCircle2,
      color: '#16a34a',
    },
    {
      title: 'SLA cumplido',
      value: formatPercentage(summary?.timeMetrics.slaCompliance),
      subtitle: 'Casos resueltos dentro del objetivo',
      icon: Target,
      color: '#f97316',
    },
    {
      title: 'Total de reclamos',
      value: formatNumber(summary?.totals.totalComplaints),
      subtitle: 'Periodo seleccionado',
      icon: BarChart3,
      color: '#7c3aed',
    },
    {
      title: 'Reclamos activos',
      value: formatNumber(summary?.totals.activeComplaints),
      subtitle: 'Pendientes de cierre',
      icon: AlertTriangle,
      color: '#dc2626',
    },
    {
      title: 'Agentes en campo',
      value: formatNumber(summary?.agentsInField),
      subtitle: 'Asignados con estado en camino',
      icon: Users,
      color: '#0f172a',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Reportes y analiticas</h2>
          <p className="text-sm text-muted-foreground">
            Ultima actualizacion: {lastUpdatedLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void fetchData()}
            disabled={loading || !token}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Rango</p>
              <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangePreset)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rango" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Estado</p>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tipo</p>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {summary?.byType.some((item) => item.typeId === null) && (
                    <SelectItem value="null">Sin tipo asignado</SelectItem>
                  )}
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Vista</p>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una vista" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Error al cargar los datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && !summary && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Cargando informacion...
          </CardContent>
        </Card>
      )}

      {summary && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {kpiItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="p-3 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        {item.title}
                      </p>
                      <p className="text-lg md:text-2xl font-semibold">{item.value}</p>
                      <p className="text-xs text-muted-foreground hidden md:block">
                        {item.subtitle}
                      </p>
                    </div>
                    <div
                      className="rounded-full p-2 text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!hasData && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron reclamos para los filtros seleccionados.
              </CardContent>
            </Card>
          )}

          {hasData && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Incidentes por tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incidentsByType}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="typeName" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="total">
                            {incidentsByType.map((entry, idx) => (
                              <Cell
                                key={entry.typeId ?? idx}
                                fill={entry.color ?? COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incidentsByType}
                            dataKey="total"
                            nameKey="typeName"
                            innerRadius="40%"
                            outerRadius="70%"
                          >
                            {incidentsByType.map((entry, idx) => (
                              <Cell
                                key={entry.typeId ?? idx}
                                fill={entry.color ?? COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reclamos por estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={statusData.map((item) => ({
                            ...item,
                            label: STATUS_LABELS[item.status] ?? item.status,
                            color: STATUS_COLORS[item.status] ?? '#6b7280',
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="total">
                            {statusData.map((item, idx) => (
                              <Cell
                                key={item.status}
                                fill={STATUS_COLORS[item.status] ?? COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalle por tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={performanceData.map((item) => ({
                            ...item,
                            typeName: item.typeName,
                            assignment: item.averageAssignmentMinutes ?? 0,
                            arrival: item.averageArrivalMinutes ?? 0,
                            sla: item.slaCompliance ?? 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="typeName" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Bar yAxisId="left" dataKey="assignment" name="Derivacion (min)" fill="#2563eb" />
                          <Bar yAxisId="left" dataKey="arrival" name="Llegada (min)" fill="#16a34a" />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="sla"
                            name="SLA (%)"
                            stroke="#f97316"
                            strokeWidth={2}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {hasData && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle>Tendencia semanal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={trendData.map((item) => ({
                          ...item,
                          label: trendLabel(item.date),
                          sla: item.slaCompliance ?? 0,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="created"
                          name="Nuevos"
                          stroke="#2563eb"
                          fill="#2563eb33"
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="resolved"
                          name="Resueltos"
                          stroke="#16a34a"
                          fill="#16a34a33"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="sla"
                          name="SLA (%)"
                          stroke="#f97316"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Mapa de calor por hora y area
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribucion de reclamos segun la hora de ingreso
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Menos incidentes</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-3 bg-muted rounded" />
                        <div className="w-4 h-3 bg-green-200 dark:bg-green-900/60 rounded" />
                        <div className="w-4 h-3 bg-green-500 rounded" />
                        <div className="w-4 h-3 bg-yellow-500 rounded" />
                        <div className="w-4 h-3 bg-orange-500 rounded" />
                        <div className="w-4 h-3 bg-red-500 rounded" />
                      </div>
                      <span>Mas incidentes</span>
                    </div>

                    <Separator />

                    <div className="overflow-x-auto">
                      <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${areaColumns.length + 1}, minmax(100px, 1fr))` }}>
                        <div className="text-xs font-medium p-1">Hora</div>
                        {areaColumns.map((area) => (
                          <div key={area.areaId ?? 'null'} className="text-xs font-medium p-1 text-center">
                            {area.areaName}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 mt-2">
                        {heatmapData
                          .filter((_, index) => index % 2 === 0)
                          .map((row) => {
                            const maxValue = Math.max(
                              ...areaColumns.map((area) => {
                                const cell = row.areas.find((item) => item.areaId === area.areaId);
                                return cell ? cell.total : 0;
                              }),
                              0,
                            );
                            const normalizedMax = maxValue > 0 ? maxValue : 1;

                            return (
                              <div
                                key={row.hour}
                                className="grid gap-1"
                                style={{ gridTemplateColumns: `repeat(${areaColumns.length + 1}, minmax(100px, 1fr))` }}
                              >
                                <div className="text-xs p-1 font-mono">{formatHour(row.hour)}</div>
                                {areaColumns.map((area) => {
                                  const cell = row.areas.find((item) => item.areaId === area.areaId);
                                  const value = cell ? cell.total : 0;
                                  return (
                                    <div
                                      key={`${row.hour}-${area.areaId ?? 'null'}`}
                                      className={`text-xs p-1 text-center rounded ${resolveHeatCellColor(
                                        value,
                                        normalizedMax,
                                      )}`}
                                    >
                                      {value}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!token && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Inicia sesion para acceder a los reportes.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
