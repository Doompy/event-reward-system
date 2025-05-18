import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Event, 
  EventConditionType,
  EventStatus,
  Reward,
  RewardType,
  RewardRequest,
  RewardRequestStatus,
  UserReward,
  UserRewardStatus,
  EventLog,
  EventLogType,
  EventParticipation,
  ParticipationStatus
} from 'libs/database/schema';
import { 
  CreateEventDto, 
  UpdateEventDto,
  CreateRewardDto,
  UpdateRewardDto,
  CreateRewardRequestDto,
  UpdateRewardRequestDto,
  CreateParticipationDto
} from './dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(Reward.name) private rewardModel: Model<Reward>,
    @InjectModel(RewardRequest.name) private rewardRequestModel: Model<RewardRequest>,
    @InjectModel(UserReward.name) private userRewardModel: Model<UserReward>,
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLog>,
    @InjectModel(EventParticipation.name) private eventParticipationModel: Model<EventParticipation>
  ) {}

  // 이벤트 관리 API
  async createEvent(createEventDto: CreateEventDto, userId: string): Promise<Event> {
    try {
      const event = new this.eventModel({
        ...createEventDto,
        createdBy: userId,
        startDate: new Date(createEventDto.startDate),
        endDate: new Date(createEventDto.endDate),
      });

      const savedEvent = await event.save();

      // 로그 기록
      await this.createEventLog(
        EventLogType.EVENT_CREATED,
        userId,
        savedEvent._id.toString(),
        null,
        null,
        { event: savedEvent }
      );

      return savedEvent;
    } catch (error) {
      this.logger.error(`Error creating event: ${error.message}`);
      throw error;
    }
  }

  async findAllEvents(filters?: Record<string, any>): Promise<Event[]> {
    try {
      const query = filters ? { ...filters } : {};
      return this.eventModel.find(query).exec();
    } catch (error) {
      this.logger.error(`Error finding events: ${error.message}`);
      throw error;
    }
  }

  async findActiveEvents(): Promise<Event[]> {
    const now = new Date();
    return this.eventModel.find({
      status: EventStatus.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).exec();
  }

  async findEventById(id: string): Promise<Event> {
    try {
      const event = await this.eventModel.findById(id).exec();
      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }
      return event;
    } catch (error) {
      this.logger.error(`Error finding event ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto, userId: string): Promise<Event> {
    try {
      const event = await this.eventModel.findById(id).exec();
      
      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      // 이벤트 상태 변경 로그 기록
      if (updateEventDto.status && updateEventDto.status !== event.status) {
        await this.createEventLog(
          EventLogType.EVENT_STATUS_CHANGED,
          userId,
          id,
          null,
          null,
          { 
            previousStatus: event.status,
            newStatus: updateEventDto.status
          }
        );
      }

      // 날짜 변환
      if (updateEventDto.startDate) {
        updateEventDto.startDate = new Date(updateEventDto.startDate) as any;
      }
      
      if (updateEventDto.endDate) {
        updateEventDto.endDate = new Date(updateEventDto.endDate) as any;
      }

      const updatedEvent = await this.eventModel.findByIdAndUpdate(
        id,
        { ...updateEventDto, updatedBy: userId },
        { new: true }
      ).exec();

      // 전체 이벤트 업데이트 로그 기록
      await this.createEventLog(
        EventLogType.EVENT_UPDATED,
        userId,
        id,
        null,
        null,
        { event: updatedEvent }
      );

      return updatedEvent;
    } catch (error) {
      this.logger.error(`Error updating event ${id}: ${error.message}`);
      throw error;
    }
  }

  // 보상 관리 API
  async createReward(createRewardDto: CreateRewardDto, userId: string): Promise<Reward> {
    try {
      // 이벤트 존재 여부 확인
      const event = await this.eventModel.findById(createRewardDto.eventId).exec();
      if (!event) {
        throw new NotFoundException(`Event with ID ${createRewardDto.eventId} not found`);
      }

      const reward = new this.rewardModel({
        ...createRewardDto,
        createdBy: userId,
        expiryDate: createRewardDto.expiryDate ? new Date(createRewardDto.expiryDate) : null
      });

      const savedReward = await reward.save();

      // 로그 기록
      await this.createEventLog(
        EventLogType.REWARD_CREATED,
        userId,
        createRewardDto.eventId,
        savedReward._id.toString(),
        null,
        { reward: savedReward }
      );

      return savedReward;
    } catch (error) {
      this.logger.error(`Error creating reward: ${error.message}`);
      throw error;
    }
  }

  async findRewardsByEventId(eventId: string): Promise<Reward[]> {
    try {
      return this.rewardModel.find({ eventId }).exec();
    } catch (error) {
      this.logger.error(`Error finding rewards for event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  async findRewardById(id: string): Promise<Reward> {
    try {
      const reward = await this.rewardModel.findById(id).exec();
      if (!reward) {
        throw new NotFoundException(`Reward with ID ${id} not found`);
      }
      return reward;
    } catch (error) {
      this.logger.error(`Error finding reward ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateReward(id: string, updateRewardDto: UpdateRewardDto, userId: string): Promise<Reward> {
    try {
      const reward = await this.rewardModel.findById(id).exec();
      
      if (!reward) {
        throw new NotFoundException(`Reward with ID ${id} not found`);
      }

      // 만료일 변환
      if (updateRewardDto.expiryDate) {
        updateRewardDto.expiryDate = new Date(updateRewardDto.expiryDate) as any;
      }

      const updatedReward = await this.rewardModel.findByIdAndUpdate(
        id,
        { ...updateRewardDto, updatedBy: userId },
        { new: true }
      ).exec();

      // 로그 기록
      await this.createEventLog(
        EventLogType.REWARD_UPDATED,
        userId,
        reward.eventId.toString(),
        id,
        null,
        { reward: updatedReward }
      );

      return updatedReward;
    } catch (error) {
      this.logger.error(`Error updating reward ${id}: ${error.message}`);
      throw error;
    }
  }

  // 보상 요청 API
  async createRewardRequest(
    createRewardRequestDto: CreateRewardRequestDto, 
    userId: string
  ): Promise<RewardRequest> {
    try {
      // 이벤트와 보상 존재 여부 확인
      const event = await this.eventModel.findById(createRewardRequestDto.eventId).exec();
      if (!event) {
        throw new NotFoundException(`Event with ID ${createRewardRequestDto.eventId} not found`);
      }

      // 보상 존재 여부 확인
      if (createRewardRequestDto.rewardIds && createRewardRequestDto.rewardIds.length > 0) {
        const rewards = await this.rewardModel.find({
          _id: { $in: createRewardRequestDto.rewardIds },
          eventId: createRewardRequestDto.eventId
        }).exec();

        if (rewards.length !== createRewardRequestDto.rewardIds.length) {
          throw new NotFoundException('Some reward IDs are invalid or do not belong to this event');
        }
      } else {
        throw new BadRequestException('At least one reward ID must be provided');
      }

      // 이벤트 참여 조건 확인
      const conditionMet = await this.verifyEventCondition(
        event, 
        userId,
        createRewardRequestDto.verificationData
      );

      if (!conditionMet) {
        throw new BadRequestException('Event conditions not met');
      }

      // 이미 처리된 요청이 있는지 확인
      const existingRequest = await this.rewardRequestModel.findOne({
        eventId: createRewardRequestDto.eventId,
        rewardIds: { $in: createRewardRequestDto.rewardIds },
        userId: userId,
        status: { $in: [RewardRequestStatus.PENDING, RewardRequestStatus.APPROVED] }
      }).exec();

      if (existingRequest) {
        throw new ConflictException('A reward request for this event and reward already exists');
      }

      // 새 요청 생성
      const rewardRequest = new this.rewardRequestModel({
        eventId: createRewardRequestDto.eventId,
        rewardIds: createRewardRequestDto.rewardIds,
        userId: userId,
        status: RewardRequestStatus.PENDING,
        requestedAt: new Date(),
        verificationData: createRewardRequestDto.verificationData || {}
      });

      const savedRequest = await rewardRequest.save();

      // 로그 기록
      await this.createEventLog(
        EventLogType.REWARD_REQUEST,
        userId,
        createRewardRequestDto.eventId,
        createRewardRequestDto.rewardIds[0], // 로그에는 첫번째 보상 ID만 기록
        savedRequest._id.toString(),
        { request: savedRequest }
      );

      return savedRequest;
    } catch (error) {
      this.logger.error(`Error creating reward request: ${error.message}`);
      throw error;
    }
  }

  async updateRewardRequest(
    id: string, 
    updateRewardRequestDto: UpdateRewardRequestDto, 
    operatorId: string
  ): Promise<RewardRequest> {
    try {
      const request = await this.rewardRequestModel.findById(id).exec();
      
      if (!request) {
        throw new NotFoundException(`Reward request with ID ${id} not found`);
      }

      // 상태 변경 로그 및 처리
      if (updateRewardRequestDto.status) {
        if (request.status === RewardRequestStatus.PENDING && 
            updateRewardRequestDto.status === RewardRequestStatus.APPROVED) {
          // 보상 발급 처리
          await this.issueRewards(id, operatorId);

          await this.createEventLog(
            EventLogType.REWARD_APPROVED,
            operatorId,
            request.eventId.toString(),
            request.rewardIds[0],
            id,
            { 
              previousStatus: request.status,
              newStatus: updateRewardRequestDto.status
            }
          );
        } else if (updateRewardRequestDto.status === RewardRequestStatus.REJECTED) {
          await this.createEventLog(
            EventLogType.REWARD_REJECTED,
            operatorId,
            request.eventId.toString(),
            request.rewardIds[0],
            id,
            {
              previousStatus: request.status,
              newStatus: updateRewardRequestDto.status,
              rejectedReason: updateRewardRequestDto.rejectedReason
            }
          );
        }
      }

      const updatedData: any = {
        ...updateRewardRequestDto,
        updatedBy: operatorId
      };

      // 상태가 변경되었고 PENDING이 아니면 처리 시간 기록
      if (updateRewardRequestDto.status && updateRewardRequestDto.status !== RewardRequestStatus.PENDING) {
        updatedData.processedBy = operatorId;
        
        if (updateRewardRequestDto.status === RewardRequestStatus.APPROVED) {
          updatedData.approvedAt = new Date();
        }
      }

      const updatedRequest = await this.rewardRequestModel.findByIdAndUpdate(
        id,
        updatedData,
        { new: true }
      ).exec();

      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error updating reward request ${id}: ${error.message}`);
      throw error;
    }
  }

  async findRewardRequestById(id: string): Promise<RewardRequest> {
    try {
      const request = await this.rewardRequestModel.findById(id).exec();
      if (!request) {
        throw new NotFoundException(`Reward request with ID ${id} not found`);
      }
      return request;
    } catch (error) {
      this.logger.error(`Error finding reward request ${id}: ${error.message}`);
      throw error;
    }
  }

  async findRewardRequestsByUserId(userId: string): Promise<RewardRequest[]> {
    try {
      return this.rewardRequestModel.find({ userId }).sort({ requestedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding reward requests for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async findRewardRequests(filters?: Record<string, any>): Promise<RewardRequest[]> {
    try {
      const query = filters ? { ...filters } : {};
      return this.rewardRequestModel.find(query).sort({ requestedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding reward requests: ${error.message}`);
      throw error;
    }
  }

  async findUserRewardsByUserId(userId: string): Promise<UserReward[]> {
    try {
      return this.userRewardModel.find({ userId }).sort({ issuedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding user rewards for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string, timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }

  private async verifyEventCondition(
    event: Event, 
    userId: string,
    verificationData?: Record<string, any>
  ): Promise<boolean> {
    // 현재 날짜 기준으로 이벤트가 활성화되었는지 확인
    const now = new Date();
    if (event.status !== EventStatus.ACTIVE ||
        event.startDate > now ||
        event.endDate < now) {
      return false;
    }

    // 이벤트 타입에 따른 조건 검증
    switch (event.conditionType) {
      case EventConditionType.LOGIN_DAYS:
      case EventConditionType.ATTENDANCE:
        // 로그인/출석 이벤트는 요청 자체만으로 조건 충족
        return true;
        
      case EventConditionType.PURCHASE_AMOUNT:
        // 구매 내역 검증 로직
        if (!verificationData || !verificationData.purchaseId) {
          return false;
        }
        // 여기서는 간단히 구매 ID가 있으면 통과하도록 함
        // 실제로는 구매 API 연동 등의 검증 필요
        return true;
        
      case EventConditionType.INVITE_FRIENDS:
        // 친구 초대 검증 로직
        if (!verificationData || !verificationData.invitedUsers || !Array.isArray(verificationData.invitedUsers)) {
          return false;
        }
        return verificationData.invitedUsers.length > 0;
        
      default:
        return false;
    }
  }

  private async issueRewards(requestId: string, operatorId: string | null): Promise<void> {
    try {
      const request = await this.rewardRequestModel.findById(requestId).exec();
      if (!request) {
        throw new NotFoundException(`Reward request with ID ${requestId} not found`);
      }

      // 이미 처리된 요청인지 확인
      if (request.status === RewardRequestStatus.APPROVED) {
        this.logger.warn(`Reward request ${requestId} already approved`);
        return;
      }

      // 각 보상에 대해 사용자 보상 생성
      if (!request.rewardIds || request.rewardIds.length === 0) {
        throw new BadRequestException('No rewards to issue');
      }

      for (const rewardId of request.rewardIds) {
        const reward = await this.rewardModel.findById(rewardId).exec();
        if (!reward) {
          this.logger.warn(`Reward with ID ${rewardId} not found`);
          continue;
        }

        // 사용자 보상 생성
        const userReward = new this.userRewardModel({
          userId: request.userId,
          eventId: request.eventId,
          rewardId: rewardId,
          requestId: request._id,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          value: reward.value,
          metadata: reward.metadata,
          status: UserRewardStatus.ACTIVE,
          expiryDate: reward.expiryDate
        });

        await userReward.save();

        // 로그 기록
        await this.createEventLog(
          EventLogType.REWARD_ISSUED,
          operatorId || 'system',
          request.eventId.toString(),
          rewardId.toString(),
          requestId,
          { userReward }
        );
      }

      // 보상 발급 수량 업데이트
      await this.rewardModel.updateMany(
        { _id: { $in: request.rewardIds } },
        { $inc: { issuedQuantity: 1 } }
      );

    } catch (error) {
      this.logger.error(`Error issuing rewards for request ${requestId}: ${error.message}`);
      throw error;
    }
  }

  private async createEventLog(
    logType: EventLogType,
    userId: string,
    eventId?: string,
    rewardId?: string,
    requestId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const log = new this.eventLogModel({
        logType,
        userId,
        eventId,
        rewardId,
        requestId,
        details,
        timestamp: new Date()
      });
      await log.save();
    } catch (error) {
      this.logger.error(`Error creating event log: ${error.message}`);
      // 로그 생성 실패는 메인 기능에 영향을 주지 않도록 예외를 다시 던지지 않음
    }
  }

  async createParticipation(createParticipationDto: CreateParticipationDto, userId: string): Promise<EventParticipation> {
    try {
      // 이벤트 존재 여부 확인
      const event = await this.eventModel.findById(createParticipationDto.eventId).exec();
      if (!event) {
        throw new NotFoundException(`Event with ID ${createParticipationDto.eventId} not found`);
      }

      // 이벤트가 활성 상태인지 확인
      const now = new Date();
      if (event.status !== EventStatus.ACTIVE ||
          event.startDate > now ||
          event.endDate < now) {
        throw new BadRequestException('Event is not active');
      }

      // 이벤트 참여 조건 검증
      const conditionMet = await this.verifyEventCondition(
        event, 
        userId,
        createParticipationDto.verificationData
      );

      if (!conditionMet) {
        throw new BadRequestException('Event conditions not met');
      }

      // 이미 참여한 경우 중복 참여 정책에 따라 처리
      const existingParticipation = await this.eventParticipationModel.findOne({
        eventId: createParticipationDto.eventId,
        userId: userId,
        status: ParticipationStatus.PARTICIPATED
      }).exec();

      if (existingParticipation && !event.allowMultipleParticipation) {
        throw new ConflictException('User has already participated in this event');
      }

      // 새 참여 기록 생성
      const participation = new this.eventParticipationModel({
        eventId: createParticipationDto.eventId,
        userId: userId,
        verificationData: createParticipationDto.verificationData || {},
        additionalData: createParticipationDto.additionalData || {},
        status: ParticipationStatus.PARTICIPATED,
        participatedAt: new Date()
      });

      const savedParticipation = await participation.save();

      // 참여자 수 증가
      await this.eventModel.findByIdAndUpdate(
        createParticipationDto.eventId,
        { $inc: { participantCount: 1 } }
      );

      // 로그 기록
      await this.createEventLog(
        EventLogType.EVENT_PARTICIPATED,
        userId,
        createParticipationDto.eventId,
        null,
        null,
        { 
          participation: savedParticipation,
          eventType: event.conditionType
        }
      );

      return savedParticipation;
    } catch (error) {
      this.logger.error(`Error creating participation: ${error.message}`);
      throw error;
    }
  }

  async getParticipationsByEventId(eventId: string): Promise<EventParticipation[]> {
    try {
      return this.eventParticipationModel.find({ eventId }).sort({ participatedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding participations for event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  async getParticipationsByUserId(userId: string): Promise<EventParticipation[]> {
    try {
      return this.eventParticipationModel.find({ userId }).sort({ participatedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`Error finding participations for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getParticipationStats(eventId: string): Promise<{ 
    totalParticipations: number;
    uniqueParticipants: number;
    participationsByDay: Record<string, number>;
    rewardRequestRate: number;
    successRate: number;
  }> {
    try {
      // 이벤트 참여 총 횟수
      const totalParticipations = await this.eventParticipationModel.countDocuments({ 
        eventId, 
        status: ParticipationStatus.PARTICIPATED 
      });

      // 고유 참여자 수
      const uniqueParticipantsResult = await this.eventParticipationModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), status: ParticipationStatus.PARTICIPATED } },
        { $group: { _id: '$userId' } },
        { $count: 'uniqueCount' }
      ]);
      const uniqueParticipants = uniqueParticipantsResult.length > 0 ? uniqueParticipantsResult[0].uniqueCount : 0;

      // 일별 참여 현황
      const participationsByDayResult = await this.eventParticipationModel.aggregate([
        { $match: { eventId: new Types.ObjectId(eventId), status: ParticipationStatus.PARTICIPATED } },
        { 
          $group: { 
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$participatedAt' } 
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const participationsByDay = participationsByDayResult.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      // 보상 요청률 (참여자 중 보상 요청을 한 비율)
      const rewardRequestsCount = await this.rewardRequestModel.countDocuments({ eventId });
      const rewardRequestRate = totalParticipations > 0 ? rewardRequestsCount / totalParticipations : 0;

      // 성공률 (보상 요청 중 승인된 비율)
      const approvedRequestsCount = await this.rewardRequestModel.countDocuments({ 
        eventId, 
        status: RewardRequestStatus.APPROVED 
      });
      const successRate = rewardRequestsCount > 0 ? approvedRequestsCount / rewardRequestsCount : 0;

      return {
        totalParticipations,
        uniqueParticipants,
        participationsByDay,
        rewardRequestRate,
        successRate
      };
    } catch (error) {
      this.logger.error(`Error getting participation stats for event ${eventId}: ${error.message}`);
      throw error;
    }
  }
} 