import { ComplaintStatus } from '../complaint.enums';

export interface ComplaintReportSummary {
  range: {
    from: string | null;
    to: string | null;
  };
  generatedAt: string;
  totals: {
    totalComplaints: number;
    activeComplaints: number;
    closedComplaints: number;
  };
  timeMetrics: {
    averageAssignmentMinutes: number | null;
    averageArrivalMinutes: number | null;
    averageResolutionMinutes: number | null;
    slaCompliance: number | null;
  };
  agentsInField: number;
  byType: ComplaintReportTypeSummary[];
  byStatus: ComplaintReportStatusSummary[];
  performanceByType: ComplaintReportPerformanceSummary[];
  weeklyTrend: ComplaintReportDailyTrend[];
  heatmap: ComplaintReportHeatmapRow[];
}

export interface ComplaintReportTypeSummary {
  typeId: number | null;
  typeName: string;
  total: number;
  percentage: number;
  color: string | null;
}

export interface ComplaintReportStatusSummary {
  status: ComplaintStatus;
  total: number;
}

export interface ComplaintReportPerformanceSummary {
  typeId: number | null;
  typeName: string;
  averageAssignmentMinutes: number | null;
  averageArrivalMinutes: number | null;
  slaCompliance: number | null;
}

export interface ComplaintReportDailyTrend {
  date: string;
  created: number;
  resolved: number;
  slaCompliance: number | null;
}

export interface ComplaintReportHeatmapRow {
  hour: number;
  areas: ComplaintReportHeatmapArea[];
}

export interface ComplaintReportHeatmapArea {
  areaId: number | null;
  areaName: string;
  total: number;
}

