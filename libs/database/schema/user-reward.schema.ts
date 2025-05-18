import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { RewardType } from './reward.schema';

export enum UserRewardStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class UserReward extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Reward', required: true })
  rewardId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RewardRequest', required: true })
  requestId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: String, required: true, enum: Object.values(RewardType) })
  type: RewardType;

  @Prop({ required: true })
  value: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;

  @Prop({ type: String, required: true, enum: Object.values(UserRewardStatus), default: UserRewardStatus.ACTIVE })
  status: UserRewardStatus;

  @Prop()
  expiryDate: Date;

  @Prop()
  usedAt: Date;
}

export const UserRewardSchema = SchemaFactory.createForClass(UserReward); 