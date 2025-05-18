import { Controller } from '@nestjs/common';
import { EventService } from './event.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { 
  CreateEventDto, 
  UpdateEventDto,
  CreateRewardDto,
  UpdateRewardDto,
  CreateRewardRequestDto,
  UpdateRewardRequestDto,
  CreateParticipationDto
} from './dto';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @MessagePattern({ cmd: 'health' })
  async checkHealth() {
    return this.eventService.healthCheck();
  }

  // 이벤트 관리 API
  @MessagePattern({ cmd: 'create_event' })
  async createEvent(@Payload() data: { createEventDto: CreateEventDto, userId: string }) {
    return this.eventService.createEvent(data.createEventDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_all_events' })
  async findAllEvents(@Payload() filters?: Record<string, any>) {
    return this.eventService.findAllEvents(filters);
  }

  @MessagePattern({ cmd: 'find_active_events' })
  async findActiveEvents() {
    return this.eventService.findActiveEvents();
  }

  @MessagePattern({ cmd: 'find_event_by_id' })
  async findEventById(@Payload() id: string) {
    return this.eventService.findEventById(id);
  }

  @MessagePattern({ cmd: 'update_event' })
  async updateEvent(@Payload() data: { id: string, updateEventDto: UpdateEventDto, userId: string }) {
    return this.eventService.updateEvent(data.id, data.updateEventDto, data.userId);
  }

  // 보상 관리 API
  @MessagePattern({ cmd: 'create_reward' })
  async createReward(@Payload() data: { createRewardDto: CreateRewardDto, userId: string }) {
    return this.eventService.createReward(data.createRewardDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_rewards_by_event_id' })
  async findRewardsByEventId(@Payload() eventId: string) {
    return this.eventService.findRewardsByEventId(eventId);
  }

  @MessagePattern({ cmd: 'find_reward_by_id' })
  async findRewardById(@Payload() id: string) {
    return this.eventService.findRewardById(id);
  }

  @MessagePattern({ cmd: 'update_reward' })
  async updateReward(@Payload() data: { id: string, updateRewardDto: UpdateRewardDto, userId: string }) {
    return this.eventService.updateReward(data.id, data.updateRewardDto, data.userId);
  }

  // 보상 요청 API
  @MessagePattern({ cmd: 'create_reward_request' })
  async createRewardRequest(@Payload() data: { createRewardRequestDto: CreateRewardRequestDto, userId: string }) {
    return this.eventService.createRewardRequest(data.createRewardRequestDto, data.userId);
  }

  @MessagePattern({ cmd: 'update_reward_request' })
  async updateRewardRequest(
    @Payload() data: { id: string, updateRewardRequestDto: UpdateRewardRequestDto, operatorId: string }
  ) {
    return this.eventService.updateRewardRequest(data.id, data.updateRewardRequestDto, data.operatorId);
  }

  @MessagePattern({ cmd: 'find_reward_request_by_id' })
  async findRewardRequestById(@Payload() id: string) {
    return this.eventService.findRewardRequestById(id);
  }

  @MessagePattern({ cmd: 'find_reward_requests_by_user_id' })
  async findRewardRequestsByUserId(@Payload() userId: string) {
    return this.eventService.findRewardRequestsByUserId(userId);
  }

  @MessagePattern({ cmd: 'find_reward_requests' })
  async findRewardRequests(@Payload() filters?: Record<string, any>) {
    return this.eventService.findRewardRequests(filters);
  }

  // 유저 보상 관리
  @MessagePattern({ cmd: 'find_user_rewards_by_user_id' })
  async findUserRewardsByUserId(@Payload() userId: string) {
    return this.eventService.findUserRewardsByUserId(userId);
  }

  // 이벤트 참여 관련 API
  @MessagePattern({ cmd: 'create_participation' })
  async createParticipation(@Payload() data: { createParticipationDto: CreateParticipationDto, userId: string }) {
    return this.eventService.createParticipation(data.createParticipationDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_participations_by_event_id' })
  async findParticipationsByEventId(@Payload() eventId: string) {
    return this.eventService.getParticipationsByEventId(eventId);
  }

  @MessagePattern({ cmd: 'find_participations_by_user_id' })
  async findParticipationsByUserId(@Payload() userId: string) {
    return this.eventService.getParticipationsByUserId(userId);
  }

  @MessagePattern({ cmd: 'get_participation_stats' })
  async getParticipationStats(@Payload() eventId: string) {
    return this.eventService.getParticipationStats(eventId);
  }
}
