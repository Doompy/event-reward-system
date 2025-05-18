import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsObject, IsDateString } from 'class-validator';
import { RewardType } from 'libs/database/schema/reward.schema';

export class CreateRewardDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(RewardType)
  type: RewardType;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsNotEmpty()
  @IsNumber()
  totalQuantity: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
} 