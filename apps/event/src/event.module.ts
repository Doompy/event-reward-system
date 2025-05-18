import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '@app/database';
import { ConfigModule } from '@nestjs/config';
import { 
  Event, 
  EventSchema, 
  Reward, 
  RewardSchema, 
  RewardRequest, 
  RewardRequestSchema,
  UserReward,
  UserRewardSchema,
  EventLog,
  EventLogSchema,
  EventParticipation,
  EventParticipationSchema
} from 'libs/database/schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: RewardRequest.name, schema: RewardRequestSchema },
      { name: UserReward.name, schema: UserRewardSchema },
      { name: EventLog.name, schema: EventLogSchema },
      { name: EventParticipation.name, schema: EventParticipationSchema },
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
