import { Expose, Type } from 'class-transformer';
import { Area } from 'src/modules/area/entities/area.entity';
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, JoinColumn, ManyToOne } from 'typeorm';
import { ComplaintPriority } from '../../complaint/complaint.enums';

@Entity('incident')
export class ComplaintType extends BaseEntity {
    @PrimaryGeneratedColumn()
    @Expose()
    id: number;

    @Column({ length: 64, unique: true, nullable: true })
    @Expose()
    code: string;

    @Column()
    @Expose()
    name: string;

    @Column()
    @Expose()
    description: string;

    @Column({ default: true })
    @Expose()
    isVisible: boolean;

    @JoinColumn()
    @ManyToOne(() => Area, area => area.incidents, { nullable: true })
    @Type(() => Area)
    @Expose()
    area: Area | null;

    @Column({ type: 'enum', enum: ComplaintPriority, default: ComplaintPriority.MEDIUM })
    @Expose()
    defaultPriority: ComplaintPriority;

    @Column({ default: false })
    @Expose()
    autoDerive: boolean;

    @Column({ length: 64, nullable: true })
    @Expose()
    icon?: string;

    @Column({ length: 128, nullable: true })
    @Expose()
    color?: string;

    constructor(partial?: Partial<ComplaintType>) {
        super()
        partial && Object.assign(this, partial)
    }
}
