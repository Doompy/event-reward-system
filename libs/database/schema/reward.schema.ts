import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum RewardType {
  POINT = 'POINT',
  ITEM = 'ITEM',
  COUPON = 'COUPON',
  CURRENCY = 'CURRENCY',
  BADGE = 'BADGE',
}

@Schema({ timestamps: true })
export class Reward extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  eventId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: RewardType })
  type: RewardType;

  @Prop({ required: true })
  value: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata: Record<string, any>;

  @Prop({ required: true, default: 0 })
  totalQuantity: number;

  @Prop({ default: 0 })
  issuedQuantity: number;

  @Prop({ default: null })
  expiryDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward); 