import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class McpServerEntity {
    @PrimaryColumn()
    key!: string;

    @Column({ type: 'text' })
    configJson!: string;
}
