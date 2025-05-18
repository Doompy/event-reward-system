import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken extends Document {
  @Prop({ required: true })
  token: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  expires: Date;

  @Prop({ default: false })
  revoked: boolean;

  @Prop()
  revokedAt: Date;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken); 