import { IsNumber } from 'class-validator';

export class CreateDiscussionDto {
  @IsNumber()
  startingNumber: number;
}