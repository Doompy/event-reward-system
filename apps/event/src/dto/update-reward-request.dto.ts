import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RewardRequestStatus } from 'libs/database/schema/reward-request.schema';

export class UpdateRewardRequestDto {
  @IsOptional()
  @IsEnum(RewardRequestStatus)
  status?: RewardRequestStatus;

  @IsOptional()
  @IsString()
  rejectedReason?: string;
} 