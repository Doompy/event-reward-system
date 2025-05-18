import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
}

@Schema({ timestamps: true })
export class RewardRequest extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Reward' }] })
  rewardIds: string[];

  @Prop({ required: true, enum: RewardRequestStatus, default: RewardRequestStatus.PENDING })
  status: RewardRequestStatus;

  @Prop({ type: MongooseSchema.Types.Mixed })
  verificationData: Record<string, any>;

  @Prop()
  approvedAt: Date;

  @Prop()
  issuedAt: Date;

  @Prop()
  rejectedReason: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  processedBy: string;
}

export const RewardRequestSchema = SchemaFactory.createForClass(RewardRequest); 