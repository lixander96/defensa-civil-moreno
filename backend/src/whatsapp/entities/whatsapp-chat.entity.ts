// src/whatsapp/entities/whatsapp-chat.entity.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { WhatsappMessageEntity } from './whatsapp-message.entity';

@Entity({ name: 'whatsapp_chat' })
export class WhatsappChatEntity extends BaseEntity {
  @PrimaryColumn()
  @Expose()
  id: string; // chat.id._serialized (ej: "54911....@c.us")

  @Column()
  @Expose()
  displayName: string;

  @Column({ nullable: true })
  @Expose()
  number: string | null;

  @Column({ default: false })
  @Expose()
  isGroup: boolean;

  @Column({ type: 'int', default: 0 })
  @Expose()
  unreadCount: number;

  @Column({ default: false })
  @Expose()
  archived: boolean;

  @Column({ default: false })
  @Expose()
  muted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  @Expose()
  updatedAt: Date | null;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;

  @UpdateDateColumn()
  @Expose()
  updatedAtRow: Date;

  @OneToMany(() => WhatsappMessageEntity, msg => msg.chat)
  messages: WhatsappMessageEntity[];
}
