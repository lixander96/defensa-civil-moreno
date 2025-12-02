import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Complaint } from './entities/complaint.entity';
import { CreateComplaintDto } from './dtos/create-complaint.dto';
import { UpdateComplaintDto } from './dtos/update-complaint.dto';
import { ComplaintType } from '../complaint-type/entities/complaint-type.entity';
import { Complainant } from './entities/complainant.entity';
import { User } from '../user/entities/user.entity';
import { ListComplaintsDto } from './dtos/list-complaints.dto';
import { ComplaintReportSummaryDto } from './dtos/complaint-report-summary.dto';
import {
  ComplaintPriority,
  ComplaintStatus,
  ComplaintTimelineEntry,
  ComplaintTimelineType,
} from './complaint.enums';
import { ComplaintReportSummary } from './interfaces/complaint-report-summary.interface';

const SLA_THRESHOLD_MINUTES = 120;

@Injectable()
export class ComplaintService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(ComplaintType)
    private readonly complaintTypeRepository: Repository<ComplaintType>,
    @InjectRepository(Complainant)
    private readonly complainantRepository: Repository<Complainant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(query: ListComplaintsDto = {}): Promise<Complaint[]> {
    const qb = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.type', 'type')
      .leftJoinAndSelect('complaint.complainant', 'complainant')
      .leftJoinAndSelect('complaint.assignedTo', 'assignedTo')
      .orderBy('complaint.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('complaint.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('complaint.priority = :priority', {
        priority: query.priority,
      });
    }

    if (query.typeId) {
      qb.andWhere('type.id = :typeId', { typeId: query.typeId });
    }

    if (query.assignedUserId) {
      qb.andWhere('assignedTo.id = :assignedUserId', {
        assignedUserId: query.assignedUserId,
      });
    }

    if (query.search) {
      const search = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('LOWER(complaint.number) LIKE :search', { search })
            .orWhere('LOWER(complaint.description) LIKE :search', { search })
            .orWhere('LOWER(complaint.address) LIKE :search', { search })
            .orWhere('LOWER(complainant.name) LIKE :search', { search })
            .orWhere('LOWER(complainant.phone) LIKE :search', { search });
        }),
      );
    }

    if (query.limit) {
      qb.take(query.limit);
    }

    if (query.offset) {
      qb.skip(query.offset);
    }

    return qb.getMany();
  }

  async getReportSummary(
    query: ComplaintReportSummaryDto,
  ): Promise<ComplaintReportSummary> {
    const fromDate = query.from ? this.startOfDay(query.from) : undefined;
    const toDate = query.to ? this.endOfDay(query.to) : undefined;

    const qb = this.complaintRepository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.type', 'type')
      .leftJoinAndSelect('type.area', 'area')
      .leftJoinAndSelect('complaint.assignedTo', 'assignedTo')
      .leftJoinAndSelect('complaint.complainant', 'complainant')
      .orderBy('complaint.createdAt', 'DESC');

    if (fromDate) {
      qb.andWhere('complaint.createdAt >= :from', { from: fromDate });
    }

    if (toDate) {
      qb.andWhere('complaint.createdAt <= :to', { to: toDate });
    }

    if (query.status) {
      qb.andWhere('complaint.status = :status', { status: query.status });
    }

    if (query.typeId) {
      qb.andWhere('type.id = :typeId', { typeId: query.typeId });
    }

    const complaints = await qb.getMany();

    const totalComplaints = complaints.length;
    const activeComplaints = complaints.filter(
      (complaint) => complaint.status !== ComplaintStatus.CLOSED,
    ).length;
    const closedComplaints = totalComplaints - activeComplaints;

    const assignmentDurations: number[] = [];
    const arrivalDurations: number[] = [];
    const resolutionDurations: number[] = [];

    let slaHits = 0;

    const typeStats = new Map<
      number | null,
      {
        typeId: number | null;
        typeName: string;
        color: string | null;
        count: number;
        assignmentDurations: number[];
        arrivalDurations: number[];
        resolutionDurations: number[];
        slaHits: number;
      }
    >();

    const areaNames = new Map<number | null, string>();
    const heatmapCounts = new Map<number, Map<number | null, number>>();

    const endDate = toDate ?? new Date();
    const trendKeys = this.buildTrendKeys(endDate);
    const trendBuckets = new Map<
      string,
      { created: number; resolved: number; slaEligible: number; slaHits: number }
    >();
    trendKeys.forEach((key) =>
      trendBuckets.set(key, { created: 0, resolved: 0, slaEligible: 0, slaHits: 0 }),
    );

    complaints.forEach((complaint) => {
      const type = complaint.type ?? null;
      const area = type?.area ?? null;
      const typeKey = type?.id ?? null;
      const areaKey = area?.id ?? null;

      if (!typeStats.has(typeKey)) {
        typeStats.set(typeKey, {
          typeId: typeKey,
          typeName: type?.name ?? 'Sin tipo',
          color: type?.color ?? null,
          count: 0,
          assignmentDurations: [],
          arrivalDurations: [],
          resolutionDurations: [],
          slaHits: 0,
        });
      }

      if (!areaNames.has(areaKey)) {
        areaNames.set(areaKey, area?.name ?? 'Sin área');
      }

      const createdAt = this.toDate(complaint.createdAt);
      const assignedAt = this.extractTimelineTimestamp(complaint, 'assigned');
      const derivedAt = this.extractTimelineTimestamp(complaint, 'derived');
      const inRouteAt = this.extractTimelineTimestamp(complaint, 'in_route');
      const verifiedAt = this.extractTimelineTimestamp(complaint, 'verified');
      const closedAt = this.extractTimelineTimestamp(complaint, 'closed');

      const assignmentEnd = derivedAt ?? assignedAt ?? null;
      const assignmentMinutes = this.minutesBetween(createdAt, assignmentEnd);
      if (assignmentMinutes !== null) {
        assignmentDurations.push(assignmentMinutes);
      }

      const arrivalStart = assignmentEnd ?? createdAt;
      const arrivalEnd = inRouteAt ?? verifiedAt ?? closedAt ?? null;
      const arrivalMinutes = this.minutesBetween(arrivalStart, arrivalEnd);
      if (arrivalMinutes !== null) {
        arrivalDurations.push(arrivalMinutes);
      }

      const resolutionEnd = closedAt ?? verifiedAt ?? null;
      const resolutionMinutes = this.minutesBetween(createdAt, resolutionEnd);
      if (resolutionMinutes !== null) {
        resolutionDurations.push(resolutionMinutes);
        if (resolutionMinutes <= SLA_THRESHOLD_MINUTES) {
          slaHits += 1;
        }
      }

      const stat = typeStats.get(typeKey)!;
      stat.count += 1;
      if (assignmentMinutes !== null) {
        stat.assignmentDurations.push(assignmentMinutes);
      }
      if (arrivalMinutes !== null) {
        stat.arrivalDurations.push(arrivalMinutes);
      }
      if (resolutionMinutes !== null) {
        stat.resolutionDurations.push(resolutionMinutes);
        if (resolutionMinutes <= SLA_THRESHOLD_MINUTES) {
          stat.slaHits += 1;
        }
      }

      if (createdAt) {
        const hour = createdAt.getHours();
        const hourBucket =
          heatmapCounts.get(hour) ?? new Map<number | null, number>();
        hourBucket.set(areaKey, (hourBucket.get(areaKey) ?? 0) + 1);
        heatmapCounts.set(hour, hourBucket);

        const createdKey = this.formatDateKey(createdAt);
        const trendCreatedBucket = trendBuckets.get(createdKey);
        if (trendCreatedBucket) {
          trendCreatedBucket.created += 1;
        }
      }

      if (resolutionEnd) {
        const resolvedKey = this.formatDateKey(resolutionEnd);
        const trendResolvedBucket = trendBuckets.get(resolvedKey);
        if (trendResolvedBucket) {
          trendResolvedBucket.resolved += 1;
          trendResolvedBucket.slaEligible += 1;
          if (resolutionMinutes !== null && resolutionMinutes <= SLA_THRESHOLD_MINUTES) {
            trendResolvedBucket.slaHits += 1;
          }
        }
      }
    });

    const byType = Array.from(typeStats.values())
      .map((stat) => ({
        typeId: stat.typeId,
        typeName: stat.typeName,
        total: stat.count,
        percentage:
          totalComplaints > 0
            ? Math.round((stat.count / totalComplaints) * 1000) / 10
            : 0,
        color: stat.color,
      }))
      .sort((a, b) => b.total - a.total);

    const performanceByType = Array.from(typeStats.values())
      .map((stat) => ({
        typeId: stat.typeId,
        typeName: stat.typeName,
        averageAssignmentMinutes: this.average(stat.assignmentDurations),
        averageArrivalMinutes: this.average(stat.arrivalDurations),
        slaCompliance:
          stat.resolutionDurations.length > 0
            ? this.percentage(stat.slaHits, stat.resolutionDurations.length)
            : null,
      }))
      .sort((a, b) => (b.averageArrivalMinutes ?? 0) - (a.averageArrivalMinutes ?? 0));

    const byStatus = Object.values(ComplaintStatus).map((status) => ({
      status,
      total: complaints.filter((complaint) => complaint.status === status).length,
    }));

    const areaEntries = Array.from(areaNames.entries()).sort((a, b) => {
      if (a[0] === null) {
        return 1;
      }
      if (b[0] === null) {
        return -1;
      }
      return a[1].localeCompare(b[1]);
    });

    if (areaEntries.length === 0) {
      areaEntries.push([null, 'Sin área'] as [number | null, string]);
    }

    const heatmap = Array.from({ length: 24 }, (_, hour) => {
      const counts = heatmapCounts.get(hour) ?? new Map<number | null, number>();
      return {
        hour,
        areas: areaEntries.map(([areaId, areaName]) => ({
          areaId,
          areaName,
          total: counts.get(areaId) ?? 0,
        })),
      };
    });

    const weeklyTrend = trendKeys.map((dateKey) => {
      const bucket = trendBuckets.get(dateKey)!;
      return {
        date: dateKey,
        created: bucket.created,
        resolved: bucket.resolved,
        slaCompliance:
          bucket.slaEligible > 0
            ? this.percentage(bucket.slaHits, bucket.slaEligible)
            : null,
      };
    });

    const timeMetrics = {
      averageAssignmentMinutes: this.average(assignmentDurations),
      averageArrivalMinutes: this.average(arrivalDurations),
      averageResolutionMinutes: this.average(resolutionDurations),
      slaCompliance:
        resolutionDurations.length > 0
          ? this.percentage(slaHits, resolutionDurations.length)
          : null,
    };

    return {
      range: {
        from: fromDate ? fromDate.toISOString() : null,
        to: toDate ? toDate.toISOString() : null,
      },
      generatedAt: new Date().toISOString(),
      totals: {
        totalComplaints,
        activeComplaints,
        closedComplaints,
      },
      timeMetrics,
      agentsInField: this.countAgentsInField(complaints),
      byType,
      byStatus,
      performanceByType,
      weeklyTrend,
      heatmap,
    };
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintRepository.findOne({
      where: { id },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return complaint;
  }

  async create(dto: CreateComplaintDto, actor?: User): Promise<Complaint> {
    const complaintType = await this.complaintTypeRepository.findOne({
      where: { id: dto.typeId },
    });
    if (!complaintType) {
      throw new NotFoundException('Complaint type not found');
    }

    const complainant = await this.resolveComplainantForCreate(dto);
    const assignedUser = await this.resolveAssignedUser(dto.assignedUserId);

    const complaint = new Complaint();
    complaint.number = await this.generateComplaintNumber();
    complaint.type = complaintType;
    complaint.description = dto.description;
    complaint.complainant = complainant;
    complaint.address = dto.address;
    complaint.priority = dto.priority ?? ComplaintPriority.MEDIUM;
    complaint.status =
      dto.status ??
      (dto.derivedTo ? ComplaintStatus.DERIVED : ComplaintStatus.OPEN);
    complaint.derivedTo = dto.derivedTo ?? null;
    complaint.attachments = dto.attachments ?? [];
    complaint.timeline = this.buildInitialTimeline(
      complaint.status,
      complaint.derivedTo,
      assignedUser,
      actor,
    );

    if (dto.location) {
      complaint.location = dto.location;
    }

    complaint.assignedTo = assignedUser ?? null;

    return this.complaintRepository.save(complaint);
  }

  async update(
    id: string,
    dto: UpdateComplaintDto,
    actor?: User,
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);
    const timeline = Array.isArray(complaint.timeline)
      ? [...complaint.timeline]
      : [];

    if (dto.typeId && dto.typeId !== complaint.type?.id) {
      const complaintType = await this.complaintTypeRepository.findOne({
        where: { id: dto.typeId },
      });
      if (!complaintType) {
        throw new NotFoundException('Complaint type not found');
      }
      complaint.type = complaintType;
    }

    await this.updateComplainant(complaint, dto);

    if (dto.description !== undefined) {
      complaint.description = dto.description;
    }

    if (dto.address !== undefined) {
      complaint.address = dto.address;
    }

    if (dto.priority !== undefined && dto.priority !== complaint.priority) {
      complaint.priority = dto.priority;
      timeline.push(
        this.createTimelineEntry(
          'message',
          `Prioridad actualizada a ${dto.priority}`,
          actor,
        ),
      );
    }

    if (dto.status && dto.status !== complaint.status) {
      complaint.status = dto.status;
      timeline.push(
        this.createTimelineEntry(
          this.statusToTimelineType(dto.status),
          `Estado actualizado a ${dto.status}`,
          actor,
        ),
      );
    }

    if (dto.derivedTo !== undefined && dto.derivedTo !== complaint.derivedTo) {
      complaint.derivedTo = dto.derivedTo ?? null;
      if (dto.derivedTo) {
        timeline.push(
          this.createTimelineEntry(
            'derived',
            `Derivado a ${dto.derivedTo}`,
            actor,
          ),
        );
      } else {
        timeline.push(
          this.createTimelineEntry(
            'message',
            'Derivacion eliminada',
            actor,
          ),
        );
      }
    }

    if (dto.location) {
      complaint.location = dto.location;
    }

    if (dto.attachments) {
      complaint.attachments = dto.attachments;
    }

    if (dto.assignedUserId !== undefined) {
      const assignedUser = await this.resolveAssignedUser(dto.assignedUserId);
      if (
        (assignedUser?.id ?? null) !== (complaint.assignedTo?.id ?? null)
      ) {
        complaint.assignedTo = assignedUser ?? null;
        timeline.push(
          this.createTimelineEntry(
            'assigned',
            assignedUser
              ? `Asignado a ${this.formatUserName(assignedUser)}`
              : 'Sin asignacion',
            actor,
          ),
        );
      }
    }

    complaint.timeline = timeline;

    return this.complaintRepository.save(complaint);
  }

  private async resolveComplainantForCreate(
    dto: CreateComplaintDto,
  ): Promise<Complainant> {
    if (dto.complainantId) {
      const existing = await this.complainantRepository.findOne({
        where: { id: dto.complainantId },
      });
      if (!existing) {
        throw new NotFoundException('Complainant not found');
      }

      existing.name = dto.complainantName ?? existing.name;
      existing.phone = dto.complainantPhone ?? existing.phone;
      if (dto.complainantAddress !== undefined) {
        existing.address = dto.complainantAddress;
      }
      return this.complainantRepository.save(existing);
    }

    const complainant = new Complainant({
      name: dto.complainantName,
      phone: dto.complainantPhone,
      address: dto.complainantAddress,
    });

    return this.complainantRepository.save(complainant);
  }

  private async updateComplainant(
    complaint: Complaint,
    dto: UpdateComplaintDto,
  ): Promise<void> {
    const complainant = complaint.complainant;
    if (!complainant) {
      return;
    }

    let changed = false;

    if (dto.complainantName && dto.complainantName !== complainant.name) {
      complainant.name = dto.complainantName;
      changed = true;
    }

    if (dto.complainantPhone && dto.complainantPhone !== complainant.phone) {
      complainant.phone = dto.complainantPhone;
      changed = true;
    }

    if (dto.complainantAddress !== undefined) {
      complainant.address = dto.complainantAddress;
      changed = true;
    }

    if (changed) {
      await this.complainantRepository.save(complainant);
    }
  }

  private createTimelineEntry(
    type: ComplaintTimelineType,
    description: string,
    actor?: User,
  ): ComplaintTimelineEntry {
    return {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      description,
      user: actor ? this.formatUserName(actor) : 'Sistema',
      timestamp: new Date().toISOString(),
    };
  }

  private buildInitialTimeline(
    status: ComplaintStatus,
    derivedTo: string | null | undefined,
    assignedUser: User | null | undefined,
    actor?: User,
  ): ComplaintTimelineEntry[] {
    const entries: ComplaintTimelineEntry[] = [
      this.createTimelineEntry('created', 'Reclamo creado', actor),
    ];

    if (derivedTo) {
      entries.push(
        this.createTimelineEntry('derived', `Derivado a ${derivedTo}`, actor),
      );
    }

    if (assignedUser) {
      entries.push(
        this.createTimelineEntry(
          'assigned',
          `Asignado a ${this.formatUserName(assignedUser)}`,
          actor,
        ),
      );
    }

    if (status && status !== ComplaintStatus.OPEN) {
      entries.push(
        this.createTimelineEntry(
          this.statusToTimelineType(status),
          `Estado inicial ${status}`,
          actor,
        ),
      );
    }

    return entries;
  }

  private statusToTimelineType(status: ComplaintStatus): ComplaintTimelineType {
    switch (status) {
      case ComplaintStatus.DERIVED:
        return 'derived';
      case ComplaintStatus.IN_ROUTE:
        return 'in_route';
      case ComplaintStatus.VERIFIED:
        return 'verified';
      case ComplaintStatus.CLOSED:
        return 'closed';
      default:
        return 'message';
    }
  }

  private formatUserName(user: User): string {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return name.length > 0 ? name : user.username;
  }

  private async resolveAssignedUser(
    assignedUserId?: number,
  ): Promise<User | null> {
    if (!assignedUserId) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id: assignedUserId },
    });

    if (!user) {
      throw new NotFoundException('Assigned user not found');
    }

    return user;
  }

  private buildTrendKeys(endDate: Date, days: number = 7): string[] {
    const normalizedEnd = this.startOfDay(endDate);
    const keys: string[] = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(normalizedEnd);
      date.setDate(normalizedEnd.getDate() - offset);
      keys.push(this.formatDateKey(date));
    }
    return keys;
  }

  private formatDateKey(date: Date | null | undefined): string {
    if (!date) {
      return '';
    }
    const copy = new Date(date);
    const year = copy.getFullYear();
    const month = (copy.getMonth() + 1).toString().padStart(2, '0');
    const day = copy.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private countAgentsInField(complaints: Complaint[]): number {
    const activeAssignments = new Set<number>();
    complaints.forEach((complaint) => {
      if (
        complaint.status === ComplaintStatus.IN_ROUTE &&
        complaint.assignedTo &&
        typeof complaint.assignedTo.id === 'number'
      ) {
        activeAssignments.add(complaint.assignedTo.id);
      }
    });
    return activeAssignments.size;
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }
    const sum = values.reduce((total, value) => total + value, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  private percentage(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  private minutesBetween(
    start: Date | null | undefined,
    end: Date | null | undefined,
  ): number | null {
    if (!start || !end) {
      return null;
    }
    const startTime = start.getTime();
    const endTime = end.getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      return null;
    }
    const diffMs = endTime - startTime;
    if (diffMs < 0) {
      return null;
    }
    return Math.round((diffMs / 60000) * 10) / 10;
  }

  private extractTimelineTimestamp(
    complaint: Complaint,
    type: ComplaintTimelineType,
  ): Date | null {
    if (!Array.isArray(complaint.timeline)) {
      return null;
    }
    const entry = complaint.timeline.find(
      (timeline) => timeline.type === type && timeline.timestamp,
    );
    if (!entry) {
      return null;
    }
    return this.toDate(entry.timestamp);
  }

  private toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }
    const date =
      value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  private async generateComplaintNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `DC-${year}${month}${day}-${random}`;
  }
}
