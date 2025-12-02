import { Expose, Type } from 'class-transformer';
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AreaType } from './area.type.entity';
import { ComplaintType } from '../../complaint-type/entities/complaint-type.entity';

@Entity()
export class Area extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  name: string;

  @ManyToOne(
    () => AreaType,
    areaType => areaType.areas
  )
  @JoinColumn({ name: 'type' })
  @Type(() => AreaType)
  @Expose()
  areaType: AreaType | null;

  @Column({ default: true })
  @Expose()
  isVisible: boolean;

  @OneToMany(() => ComplaintType, (complaintType) => complaintType.area, {
    cascade: true,
  })
  incidents: ComplaintType[];

  constructor(partial?: Partial<Area>) {
    super();
    partial && Object.assign(this, partial);
  }
}
