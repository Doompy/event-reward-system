import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum ParticipationStatus {
  PARTICIPATED = 'PARTICIPATED',
  REWARDED = 'REWARDED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true, collection: 'event_participations' })
export class EventParticipation extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: ParticipationStatus, default: ParticipationStatus.PARTICIPATED })
  status: ParticipationStatus;

  @Prop({ type: Date, required: true, default: Date.now })
  participatedAt: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  verificationData?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isRewardRequested: boolean;
  
  @Prop({ type: Date })
  rewardRequestedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RewardRequest' })
  rewardRequestId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  rewardedAt?: Date;

  @Prop({ type: Number, default: 1 })
  participationCount: number;

  // 특정 이벤트 유형에 따른 추가 데이터 필드
  @Prop({ type: MongooseSchema.Types.Mixed })
  additionalData?: Record<string, any>;
}

export const EventParticipationSchema = SchemaFactory.createForClass(EventParticipation); 