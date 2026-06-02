import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class ChatConfigEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    provider!: string;

    @Column({ nullable: true })
    model!: string;

    @Column({ nullable: true })
    encryptedApiKey!: string;

    @CreateDateColumn()
    createdAt!: Date;
}