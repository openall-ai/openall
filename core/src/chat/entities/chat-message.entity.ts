import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity()
export class ChatMessageEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    conversationId!: string;

    @Column({ nullable: true, })
    user?: string;

    @Column('text')
    content!: string;

    @CreateDateColumn()
    createdAt!: Date;
}