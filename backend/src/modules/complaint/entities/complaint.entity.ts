import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose, Type } from 'class-transformer';
import { ComplaintType } from '../../complaint-type/entities/complaint-type.entity';
import { Complainant } from './complainant.entity';
import { User } from '../../user/entities/user.entity';
import {
  ComplaintPriority,
  ComplaintStatus,
  ComplaintTimelineEntry,
} from '../complaint.enums';

@Entity('complaint')
export class Complaint extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column({ unique: true })
  @Expose()
  number: string;

  @ManyToOne(() => ComplaintType, { eager: true })
  @JoinColumn({ name: 'type_id' })
  @Type(() => ComplaintType)
  @Expose()
  type: ComplaintType;

  @Column({ type: 'text' })
  @Expose()
  description: string;

  @ManyToOne(() => Complainant, { eager: true, cascade: ['insert', 'update'] })
  @JoinColumn({ name: 'complainant_id' })
  @Type(() => Complainant)
  @Expose()
  complainant: Complainant;

  @Column({ length: 256 })
  @Expose()
  address: string;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  @Expose()
  status: ComplaintStatus;

  @Column({ type: 'enum', enum: ComplaintPriority, default: ComplaintPriority.MEDIUM })
  @Expose()
  priority: ComplaintPriority;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  @Type(() => User)
  @Expose()
  assignedTo?: User | null;

  @Column({ length: 64, nullable: true })
  @Expose()
  derivedTo?: string | null;

  @Column({ type: 'double precision', nullable: true })
  private locationLat?: number | null;

  @Column({ type: 'double precision', nullable: true })
  private locationLng?: number | null;

  @Expose()
  get location():
    | {
        lat: number;
        lng: number;
      }
    | null {
    if (
      typeof this.locationLat !== 'number' ||
      typeof this.locationLng !== 'number'
    ) {
      return null;
    }

    return {
      lat: this.locationLat,
      lng: this.locationLng,
    };
  }

  set location(
    value:
      | {
          lat: number;
          lng: number;
        }
      | null
  ) {
    if (!value) {
      this.locationLat = null;
      this.locationLng = null;
      return;
    }

    this.locationLat = value.lat;
    this.locationLng = value.lng;
  }

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  @Expose()
  attachments: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  @Expose()
  timeline: ComplaintTimelineEntry[];

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAt: Date;

  constructor(partial?: Partial<Complaint>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
