import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Complaint } from './complaint.entity';

@Entity('complainant')
export class Complainant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 128 })
  name: string;

  @Column({ length: 32 })
  phone: string;

  @Column({ length: 256, nullable: true })
  address?: string;

  @OneToMany(() => Complaint, (complaint) => complaint.complainant)
  complaints: Complaint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial?: Partial<Complainant>) {
    super();
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
