// src/whatsapp/entities/whatsapp-message.entity.ts
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { WhatsappChatEntity } from './whatsapp-chat.entity';

@Entity({ name: 'whatsapp_message' })
@Index(['chatId', 'timestamp'])
export class WhatsappMessageEntity extends BaseEntity {
  @PrimaryColumn()
  @Expose()
  id: string; // message.id._serialized

  @Column()
  @Expose()
  chatId: string;

  @ManyToOne(() => WhatsappChatEntity, (chat) => chat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat: WhatsappChatEntity;

  @Column({ type: 'text' })
  @Expose()
  body: string;

  @Column()
  @Expose()
  fromMe: boolean;

  @Column({ nullable: true })
  @Expose()
  senderId: string | null;

  @Column({ nullable: true })
  @Expose()
  senderName: string | null;

  @Column({ type: 'timestamptz' })
  @Expose()
  timestamp: Date;

  @Column()
  @Expose()
  type: string;

  @Column({ default: false })
  @Expose()
  hasMedia: boolean;

  @Column({ type: 'int', nullable: true })
  @Expose()
  ack: number | null;

  // Si querés guardar media, podés dejarlo simple así:
  @Column({ type: 'text', nullable: true })
  @Expose()
  mediaDataBase64: string | null;

  @Column({ nullable: true })
  @Expose()
  mediaMimeType: string | null;

  @Column({ nullable: true })
  @Expose()
  mediaFileName: string | null;

  @Column({ type: 'int', nullable: true })
  @Expose()
  mediaFileSize: number | null;

  @Column({ type: 'int', nullable: true })
  @Expose()
  mediaDurationSeconds: number | null;

  @CreateDateColumn()
  @Expose()
  createdAt: Date;
}
