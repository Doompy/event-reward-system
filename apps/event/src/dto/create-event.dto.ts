import { IsNotEmpty, IsString, IsDateString, IsEnum, IsBoolean, IsOptional, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus, EventConditionType } from 'libs/database/schema/event.schema';
import { ApiProperty } from '@nestjs/swagger';

export class ConditionValueDto {
  @ApiProperty({ 
    description: '조건 달성에 필요한 횟수',
    required: false,
    example: 3
  })
  @IsOptional()
  @IsNumber()
  count?: number;

  @ApiProperty({ 
    description: '조건 달성에 필요한 금액',
    required: false,
    example: 10000
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ 
    description: '조건 달성에 필요한 일수',
    required: false,
    example: 7
  })
  @IsOptional()
  @IsNumber()
  days?: number;
  
  @ApiProperty({ 
    description: '커스텀 조건 데이터',
    required: false,
    example: { customField: 'value' }
  })
  @IsOptional()
  @IsObject()
  customData?: Record<string, any>;
}

export class CreateEventDto {
  @ApiProperty({ 
    description: '이벤트 제목',
    example: '신규 가입자 이벤트'
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ 
    description: '이벤트 설명',
    example: '신규 가입자 대상 포인트 지급 이벤트'
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ 
    description: '이벤트 시작일',
    example: '2024-01-01T00:00:00Z'
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: '이벤트 종료일',
    example: '2024-12-31T23:59:59Z'
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ 
    description: '이벤트 상태',
    enum: EventStatus,
    example: EventStatus.ACTIVE
  })
  @IsEnum(EventStatus)
  status: EventStatus;

  @ApiProperty({ 
    description: '이벤트 조건 타입',
    enum: EventConditionType,
    example: EventConditionType.ATTENDANCE
  })
  @IsEnum(EventConditionType)
  conditionType: EventConditionType;

  @ApiProperty({ 
    description: '이벤트 조건 값',
    type: ConditionValueDto
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ConditionValueDto)
  conditionValue: ConditionValueDto;

  @ApiProperty({ 
    description: '자동 보상 지급 여부',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  autoReward?: boolean;

  @ApiProperty({ 
    description: '다중 참여 허용 여부',
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleParticipation?: boolean;

  @ApiProperty({ 
    description: '최대 참여자 수',
    required: false,
    example: 1000
  })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;
} 