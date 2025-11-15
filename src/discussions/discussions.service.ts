import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscussionNode, Operation } from './entities/discussion-node.entity';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { AddOperationDto } from './dto/add-operation.dto';

@Injectable()
export class DiscussionsService {
    constructor(
        @InjectRepository(DiscussionNode)
        private discussionNodeRepository: Repository<DiscussionNode>,
    ) { }

    async createDiscussion(userId: string, createDiscussionDto: CreateDiscussionDto) {
        const node = this.discussionNodeRepository.create({
            value: createDiscussionDto.startingNumber,
            operation: null,
            operand: null,
            parentId: null,
            authorId: userId,
        });

        return this.discussionNodeRepository.save(node);
    }

    async addOperation(userId: string, addOperationDto: AddOperationDto) {
        const parent = await this.discussionNodeRepository.findOne({
            where: { id: addOperationDto.parentId },
        });

        if (!parent) {
            throw new NotFoundException('Parent node not found');
        }

        const result = this.calculateResult(
            parent.value,
            addOperationDto.operation,
            addOperationDto.operand,
        );

        const node = this.discussionNodeRepository.create({
            value: result,
            operation: addOperationDto.operation,
            operand: addOperationDto.operand,
            parentId: parent.id,
            authorId: userId,
        });

        return this.discussionNodeRepository.save(node);
    }

    async getAllDiscussions(): Promise<(DiscussionNode & { children: any[] })[]> {
        const allNodes = await this.discussionNodeRepository.find({
            relations: ['author'],
            order: { createdAt: 'DESC' },
        });

        type TreeNode = DiscussionNode & { children: TreeNode[] };
        const nodeMap = new Map<string, TreeNode>();

        allNodes.forEach(node => {
            nodeMap.set(node.id, { ...node, children: [] });
        });

        const rootNodes: TreeNode[] = [];

        allNodes.forEach(node => {
            const currentNode = nodeMap.get(node.id)!;

            if (node.parentId === null) {
                rootNodes.push(currentNode);
            } else {
                const parent = nodeMap.get(node.parentId);
                if (parent) {
                    parent.children.push(currentNode);
                }
            }
        });

        return rootNodes;
    }

    private calculateResult(leftValue: number, operation: Operation, rightValue: number): number {
        switch (operation) {
            case Operation.ADD:
                return leftValue + rightValue;
            case Operation.SUBTRACT:
                return leftValue - rightValue;
            case Operation.MULTIPLY:
                return leftValue * rightValue;
            case Operation.DIVIDE:
                if (rightValue === 0) {
                    throw new BadRequestException('Division by zero is not allowed');
                }
                return leftValue / rightValue;
            default:
                throw new BadRequestException('Invalid operation');
        }
    }
}