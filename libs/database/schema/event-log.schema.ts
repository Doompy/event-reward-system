import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum EventLogType {
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_STATUS_CHANGED = 'EVENT_STATUS_CHANGED',
  EVENT_PARTICIPATED = 'EVENT_PARTICIPATED',
  REWARD_CREATED = 'REWARD_CREATED',
  REWARD_UPDATED = 'REWARD_UPDATED',
  REWARD_REQUEST = 'REWARD_REQUEST',
  REWARD_APPROVED = 'REWARD_APPROVED',
  REWARD_REJECTED = 'REWARD_REJECTED',
  REWARD_ISSUED = 'REWARD_ISSUED',
}

@Schema({ timestamps: true })
export class EventLog extends Document {
  @Prop({ required: true, enum: EventLogType })
  logType: EventLogType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event' })
  eventId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Reward' })
  rewardId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RewardRequest' })
  requestId: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  details: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog); 