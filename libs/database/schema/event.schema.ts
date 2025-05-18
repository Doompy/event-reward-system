import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ENDED = 'ENDED',
}

export enum EventConditionType {
  LOGIN_DAYS = 'LOGIN_DAYS',
  INVITE_FRIENDS = 'INVITE_FRIENDS',
  PURCHASE_AMOUNT = 'PURCHASE_AMOUNT',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  ATTENDANCE = 'ATTENDANCE',
  CUSTOM = 'CUSTOM',
}

@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, enum: EventStatus, default: EventStatus.DRAFT })
  status: EventStatus;

  @Prop({ required: true, enum: EventConditionType })
  conditionType: EventConditionType;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  conditionValue: Record<string, any>;

  @Prop({ default: false })
  autoReward: boolean;

  @Prop({ default: false })
  allowMultipleParticipation: boolean;

  @Prop({ default: 0 })
  participantCount: number;

  @Prop()
  maxParticipants?: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: string;
}

export const EventSchema = SchemaFactory.createForClass(Event); 