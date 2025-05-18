import { IsNotEmpty, IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateRewardRequestDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsNotEmpty()
  @IsArray()
  rewardIds: string[];

  @IsOptional()
  @IsObject()
  verificationData?: Record<string, any>;
} 