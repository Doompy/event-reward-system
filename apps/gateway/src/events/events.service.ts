import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { HealthService } from '../health/health.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
    private readonly healthService: HealthService,
  ) {}

  // 이벤트 관리 API
  async createEvent(createEventDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'create_event' }, { createEventDto, userId })
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findAllEvents(filters?: Record<string, any>) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_all_events' }, filters || {})
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding all events: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findActiveEvents() {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_active_events' }, {})
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding active events: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findEventById(id: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_event_by_id' }, id)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding event by id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async updateEvent(id: string, updateEventDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'update_event' }, { id, updateEventDto, userId })
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error updating event: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  // 보상 관리 API
  async createReward(createRewardDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'create_reward' }, { createRewardDto, userId })
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error creating reward: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findRewardsByEventId(eventId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_rewards_by_event_id' }, eventId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding rewards by event id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findRewardById(id: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_reward_by_id' }, id)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding reward by id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async updateReward(id: string, updateRewardDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'update_reward' }, { id, updateRewardDto, userId })
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error updating reward: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  // 보상 요청 API
  async createRewardRequest(createRewardRequestDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send(
          { cmd: 'create_reward_request' }, 
          { createRewardRequestDto, userId }
        )
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error creating reward request: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async updateRewardRequest(id: string, updateRewardRequestDto: any, operatorId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send(
          { cmd: 'update_reward_request' }, 
          { id, updateRewardRequestDto, operatorId }
        )
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error updating reward request: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findRewardRequestById(id: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_reward_request_by_id' }, id)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding reward request by id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findRewardRequestsByUserId(userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_reward_requests_by_user_id' }, userId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding reward requests by user id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findRewardRequests(filters?: Record<string, any>) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_reward_requests' }, filters || {})
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding reward requests: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  // 유저 보상 관리
  async findUserRewardsByUserId(userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_user_rewards_by_user_id' }, userId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding user rewards by user id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  // 이벤트 참여 관련 API
  async createParticipation(createParticipationDto: any, userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send(
          { cmd: 'create_participation' },
          { createParticipationDto, userId }
        )
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error creating participation: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findParticipationsByEventId(eventId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_participations_by_event_id' }, eventId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding participations by event id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async findParticipationsByUserId(userId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'find_participations_by_user_id' }, userId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error finding participations by user id: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }

  async getParticipationStats(eventId: string) {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'get_participation_stats' }, eventId)
      );
      this.healthService.updateServiceStatus('event', true);
      return result;
    } catch (error) {
      this.logger.error(`Error getting participation stats: ${error.message}`);
      this.healthService.updateServiceStatus('event', false);
      throw error;
    }
  }
} 