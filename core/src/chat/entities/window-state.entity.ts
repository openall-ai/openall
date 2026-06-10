import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn } from 'typeorm';

@Entity()
export class WindowStateEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    conversationId!: string;

    @Column({ nullable: true, })
    user?: string;

    @Column()
    title!: string;

    @Column('text')
    content!: string;

    @Column({ default: false })
    pinned!: boolean;

    @Column({ default: true })
    isOpen!: boolean;

    @DeleteDateColumn()
    closedAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}