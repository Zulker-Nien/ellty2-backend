import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscussionsService } from './discussions.service';
import { DiscussionNode, Operation } from './entities/discussion-node.entity';
import { Repository } from 'typeorm';

describe('DiscussionsService', () => {
    let service: DiscussionsService;
    let repository: Repository<DiscussionNode>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DiscussionsService,
                {
                    provide: getRepositoryToken(DiscussionNode),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DiscussionsService>(DiscussionsService);
        repository = module.get<Repository<DiscussionNode>>(getRepositoryToken(DiscussionNode));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createDiscussion', () => {
        it('should create a starting node', async () => {
            const userId = 'user-id';
            const startingNumber = 10;

            const mockNode = {
                id: 'node-id',
                value: startingNumber,
                operation: null,
                operand: null,
                parentId: null,
                authorId: userId,
            };

            jest.spyOn(repository, 'create').mockReturnValue(mockNode as any);
            jest.spyOn(repository, 'save').mockResolvedValue(mockNode as any);

            const result = await service.createDiscussion(userId, { startingNumber });

            expect(repository.create).toHaveBeenCalledWith({
                value: startingNumber,
                operation: null,
                operand: null,
                parentId: null,
                authorId: userId,
            });
            expect(result).toEqual(mockNode);
        });
    });

    describe('addOperation', () => {
        it('should add an operation node', async () => {
            const userId = 'user-id';
            const parentNode = {
                id: 'parent-id',
                value: 10,
                operation: null,
                operand: null,
            };

            const mockNode = {
                id: 'node-id',
                value: 15,
                operation: Operation.ADD,
                operand: 5,
                parentId: 'parent-id',
                authorId: userId,
            };

            jest.spyOn(repository, 'findOne').mockResolvedValue(parentNode as any);
            jest.spyOn(repository, 'create').mockReturnValue(mockNode as any);
            jest.spyOn(repository, 'save').mockResolvedValue(mockNode as any);

            const result = await service.addOperation(userId, {
                parentId: 'parent-id',
                operation: Operation.ADD,
                operand: 5,
            });

            expect(result.value).toBe(15);
            expect(result.operation).toBe(Operation.ADD);
        });

        it('should throw error for division by zero', async () => {
            const userId = 'user-id';
            const parentNode = {
                id: 'parent-id',
                value: 10,
            };

            jest.spyOn(repository, 'findOne').mockResolvedValue(parentNode as any);

            await expect(
                service.addOperation(userId, {
                    parentId: 'parent-id',
                    operation: Operation.DIVIDE,
                    operand: 0,
                })
            ).rejects.toThrow('Division by zero is not allowed');
        });
    });
});