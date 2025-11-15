import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Operation } from '../entities/discussion-node.entity';

export class AddOperationDto {
  @IsUUID()
  parentId: string;

  @IsEnum(Operation)
  operation: Operation;

  @IsNumber()
  operand: number;
}