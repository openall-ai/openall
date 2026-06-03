import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class McpServerEntity {
    @PrimaryColumn()
    key!: string;

    @Column()
    enabled!: boolean;

    @Column()
    command!: string;

    @Column()
    args!: string;
}