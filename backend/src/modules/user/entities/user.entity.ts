import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Expose } from 'class-transformer';

export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    AGENT = 'AGENT',
    OPERATOR = 'OPERATOR',
}

@Entity()
export class User extends BaseEntity {
    constructor(partial?: Partial<User>) {
        super()
        partial && Object.assign(this, partial)
    }

    @PrimaryGeneratedColumn()
    @Expose()
    id: number;
    
    @Column({length: 64})
    @Expose()
    username: string;
    
    @Column({length: 64})
    @Expose()
    firstName: string;
    
    @Column({length: 64})
    @Expose()
    lastName: string;
    
    @Column()
    @Expose({toClassOnly: true})
    password: string;
    
    @Column({ type: 'enum', enum: Role})
    @Expose()
    role: Role;
}