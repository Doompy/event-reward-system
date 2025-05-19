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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('events')
@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @MessagePattern({ cmd: 'health' })
  @ApiOperation({ summary: '서버 상태 확인' })
  @ApiResponse({ status: 200, description: '서버가 정상 동작 중' })
  async checkHealth() {
    return this.eventService.healthCheck();
  }

  // 이벤트 관리 API
  @MessagePattern({ cmd: 'create_event' })
  @ApiOperation({ summary: '이벤트 생성' })
  @ApiResponse({ status: 201, description: '이벤트가 성공적으로 생성됨' })
  async createEvent(@Payload() data: { createEventDto: CreateEventDto, userId: string }) {
    return this.eventService.createEvent(data.createEventDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_all_events' })
  @ApiOperation({ summary: '모든 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 목록 조회 성공' })
  async findAllEvents(@Payload() filters?: Record<string, any>) {
    return this.eventService.findAllEvents(filters);
  }

  @MessagePattern({ cmd: 'find_active_events' })
  @ApiOperation({ summary: '활성화된 이벤트 조회' })
  @ApiResponse({ status: 200, description: '활성화된 이벤트 목록 조회 성공' })
  async findActiveEvents() {
    return this.eventService.findActiveEvents();
  }

  @MessagePattern({ cmd: 'find_event_by_id' })
  @ApiOperation({ summary: '특정 이벤트 조회' })
  @ApiResponse({ status: 200, description: '이벤트 조회 성공' })
  async findEventById(@Payload() id: string) {
    return this.eventService.findEventById(id);
  }

  @MessagePattern({ cmd: 'update_event' })
  @ApiOperation({ summary: '이벤트 수정' })
  @ApiResponse({ status: 200, description: '이벤트 수정 성공' })
  async updateEvent(@Payload() data: { id: string, updateEventDto: UpdateEventDto, userId: string }) {
    return this.eventService.updateEvent(data.id, data.updateEventDto, data.userId);
  }

  // 보상 관리 API
  @MessagePattern({ cmd: 'create_reward' })
  @ApiOperation({ summary: '보상 생성' })
  @ApiResponse({ status: 201, description: '보상이 성공적으로 생성됨' })
  async createReward(@Payload() data: { createRewardDto: CreateRewardDto, userId: string }) {
    return this.eventService.createReward(data.createRewardDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_rewards_by_event_id' })
  @ApiOperation({ summary: '이벤트별 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 목록 조회 성공' })
  async findRewardsByEventId(@Payload() eventId: string) {
    return this.eventService.findRewardsByEventId(eventId);
  }

  @MessagePattern({ cmd: 'find_reward_by_id' })
  @ApiOperation({ summary: '특정 보상 조회' })
  @ApiResponse({ status: 200, description: '보상 조회 성공' })
  async findRewardById(@Payload() id: string) {
    return this.eventService.findRewardById(id);
  }

  @MessagePattern({ cmd: 'update_reward' })
  @ApiOperation({ summary: '보상 수정' })
  @ApiResponse({ status: 200, description: '보상 수정 성공' })
  async updateReward(@Payload() data: { id: string, updateRewardDto: UpdateRewardDto, userId: string }) {
    return this.eventService.updateReward(data.id, data.updateRewardDto, data.userId);
  }

  // 보상 요청 API
  @MessagePattern({ cmd: 'create_reward_request' })
  @ApiOperation({ summary: '보상 요청 생성' })
  @ApiResponse({ status: 201, description: '보상 요청이 성공적으로 생성됨' })
  async createRewardRequest(@Payload() data: { createRewardRequestDto: CreateRewardRequestDto, userId: string }) {
    return this.eventService.createRewardRequest(data.createRewardRequestDto, data.userId);
  }

  @MessagePattern({ cmd: 'update_reward_request' })
  @ApiOperation({ summary: '보상 요청 상태 수정' })
  @ApiResponse({ status: 200, description: '보상 요청 상태 수정 성공' })
  async updateRewardRequest(
    @Payload() data: { id: string, updateRewardRequestDto: UpdateRewardRequestDto, operatorId: string }
  ) {
    return this.eventService.updateRewardRequest(data.id, data.updateRewardRequestDto, data.operatorId);
  }

  @MessagePattern({ cmd: 'find_reward_request_by_id' })
  @ApiOperation({ summary: '특정 보상 요청 조회' })
  @ApiResponse({ status: 200, description: '보상 요청 조회 성공' })
  async findRewardRequestById(@Payload() id: string) {
    return this.eventService.findRewardRequestById(id);
  }

  @MessagePattern({ cmd: 'find_reward_requests_by_user_id' })
  @ApiOperation({ summary: '사용자별 보상 요청 조회' })
  @ApiResponse({ status: 200, description: '보상 요청 목록 조회 성공' })
  async findRewardRequestsByUserId(@Payload() userId: string) {
    return this.eventService.findRewardRequestsByUserId(userId);
  }

  @MessagePattern({ cmd: 'find_reward_requests' })
  @ApiOperation({ summary: '보상 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '보상 요청 목록 조회 성공' })
  async findRewardRequests(@Payload() filters?: Record<string, any>) {
    return this.eventService.findRewardRequests(filters);
  }

  // 유저 보상 관리
  @MessagePattern({ cmd: 'find_user_rewards_by_user_id' })
  @ApiOperation({ summary: '사용자별 보상 조회' })
  @ApiResponse({ status: 200, description: '사용자 보상 목록 조회 성공' })
  async findUserRewardsByUserId(@Payload() userId: string) {
    return this.eventService.findUserRewardsByUserId(userId);
  }

  // 이벤트 참여 관련 API
  @MessagePattern({ cmd: 'create_participation' })
  @ApiOperation({ summary: '이벤트 참여' })
  @ApiResponse({ status: 201, description: '이벤트 참여 성공' })
  async createParticipation(@Payload() data: { createParticipationDto: CreateParticipationDto, userId: string }) {
    return this.eventService.createParticipation(data.createParticipationDto, data.userId);
  }

  @MessagePattern({ cmd: 'find_participations_by_event_id' })
  @ApiOperation({ summary: '이벤트별 참여자 조회' })
  @ApiResponse({ status: 200, description: '참여자 목록 조회 성공' })
  async findParticipationsByEventId(@Payload() eventId: string) {
    return this.eventService.getParticipationsByEventId(eventId);
  }

  @MessagePattern({ cmd: 'find_participations_by_user_id' })
  @ApiOperation({ summary: '사용자별 이벤트 참여 조회' })
  @ApiResponse({ status: 200, description: '참여 이벤트 목록 조회 성공' })
  async findParticipationsByUserId(@Payload() userId: string) {
    return this.eventService.getParticipationsByUserId(userId);
  }

  @MessagePattern({ cmd: 'get_participation_stats' })
  @ApiOperation({ summary: '이벤트 참여 통계 조회' })
  @ApiResponse({ status: 200, description: '참여 통계 조회 성공' })
  async getParticipationStats(@Payload() eventId: string) {
    return this.eventService.getParticipationStats(eventId);
  }
}
