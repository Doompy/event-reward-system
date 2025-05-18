import { IsNotEmpty, IsString, IsDateString, IsEnum, IsBoolean, IsOptional, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus, EventConditionType } from 'libs/database/schema/event.schema';

export class ConditionValueDto {
  @IsOptional()
  @IsNumber()
  count?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  days?: number;
  
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsEnum(EventStatus)
  status: EventStatus;

  @IsEnum(EventConditionType)
  conditionType: EventConditionType;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ConditionValueDto)
  conditionValue: ConditionValueDto;

  @IsOptional()
  @IsBoolean()
  autoReward?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMultipleParticipation?: boolean;

  @IsOptional()
  @IsNumber()
  maxParticipants?: number;
} 