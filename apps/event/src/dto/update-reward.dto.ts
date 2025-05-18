import { PartialType } from '@nestjs/mapped-types';
import { CreateRewardDto } from './create-reward.dto';
import { IsOptional, IsNumber } from 'class-validator';

export class UpdateRewardDto extends PartialType(CreateRewardDto) {
  @IsOptional()
  @IsNumber()
  issuedQuantity?: number;
} 