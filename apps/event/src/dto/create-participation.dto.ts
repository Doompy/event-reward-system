import { IsMongoId, IsObject, IsOptional } from 'class-validator';

export class CreateParticipationDto {
  @IsMongoId()
  eventId: string;

  @IsObject()
  @IsOptional()
  verificationData?: Record<string, any>;

  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;
} 