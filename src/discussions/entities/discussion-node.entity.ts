import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Operation {
    ADD = 'add',
    SUBTRACT = 'subtract',
    MULTIPLY = 'multiply',
    DIVIDE = 'divide',
}

@Entity('discussion_nodes')
export class DiscussionNode {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('decimal', { precision: 20, scale: 10 })
    value: number;

    @Column({
        type: 'enum',
        enum: Operation,
        nullable: true,
    })
    operation: Operation | null;

    @Column('decimal', { precision: 20, scale: 10, nullable: true })
    operand: number | null;

    @Column({ nullable: true })
    parentId: string | null;

    @ManyToOne(() => DiscussionNode, node => node.children, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: DiscussionNode | null;

    @OneToMany(() => DiscussionNode, node => node.parent)
    children: DiscussionNode[];

    @ManyToOne(() => User, user => user.nodes)
    author: User;

    @Column()
    authorId: string;

    @CreateDateColumn()
    createdAt: Date;
}