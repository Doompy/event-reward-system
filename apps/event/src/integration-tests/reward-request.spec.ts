import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from '../event.service';
import { getModelToken } from '@nestjs/mongoose';
import { 
  Event, 
  EventConditionType, 
  EventStatus, 
  Reward, 
  RewardRequest, 
  RewardRequestStatus, 
  UserReward,
  RewardType,
  EventLog,
  EventLogType
} from 'libs/database/schema';
import { Model, Types } from 'mongoose';
import { CreateRewardRequestDto } from '../dto';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('Event Service - Reward Request Flow', () => {
  let service: EventService;
  let eventModel: Model<Event>;
  let rewardModel: Model<Reward>;
  let rewardRequestModel: Model<RewardRequest>;
  let userRewardModel: Model<UserReward>;
  let eventLogModel: Model<EventLog>;

  // 현재 날짜로부터 1년 뒤 날짜 계산
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);

  const mockEvent = {
    _id: new Types.ObjectId('6451234567890123456789a1'),
    title: 'Test Event',
    description: 'Test Description',
    startDate: new Date('2023-01-01'), // 과거 시작일
    endDate: futureDate, // 미래의 종료일로 설정
    status: EventStatus.ACTIVE,
    conditionType: EventConditionType.ATTENDANCE,
    conditionValue: { requiredAttendance: 1 },
    autoReward: true,
    allowMultipleParticipation: false,
    participantCount: 0,
  };

  const inactiveEvent = {
    ...mockEvent,
    _id: new Types.ObjectId('6451234567890123456789a2'),
    status: EventStatus.DRAFT,
  };

  const expiredEvent = {
    ...mockEvent,
    _id: new Types.ObjectId('6451234567890123456789a3'),
    endDate: pastDate,
  };

  const mockReward = {
    _id: new Types.ObjectId('6461234567890123456789a2'),
    eventId: mockEvent._id.toString(),
    name: 'Test Reward',
    description: 'Test Reward Description',
    type: RewardType.POINT,
    value: '100',
    totalQuantity: 10,
    issuedQuantity: 0,
  };

  const mockExistingRequest = {
    _id: new Types.ObjectId('6481234567890123456789a4'),
    userId: new Types.ObjectId('6471234567890123456789a3'),
    eventId: mockEvent._id.toString(),
    rewardIds: [mockReward._id.toString()],
    status: RewardRequestStatus.PENDING,
    verificationData: { attendanceDate: '2023-05-01' },
  };

  const userId = new Types.ObjectId('6471234567890123456789a3').toString();

  beforeEach(async () => {
    const mockEventModel = {
      findById: jest.fn().mockImplementation((id) => {
        if (id === inactiveEvent._id.toString()) {
          return { exec: jest.fn().mockResolvedValue(inactiveEvent) };
        } else if (id === expiredEvent._id.toString()) {
          return { exec: jest.fn().mockResolvedValue(expiredEvent) };
        } else if (id === mockEvent._id.toString()) {
          return { exec: jest.fn().mockResolvedValue(mockEvent) };
        } else {
          return { exec: jest.fn().mockResolvedValue(null) };
        }
      }),
      findByIdAndUpdate: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(mockEvent),
      })),
    };

    const mockRewardModel = {
      find: jest.fn().mockImplementation((query) => {
        if (query && query.eventId === 'empty-rewards') {
          return { exec: jest.fn().mockResolvedValue([]) };
        }
        return { exec: jest.fn().mockResolvedValue([mockReward]) };
      }),
      findByIdAndUpdate: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue({ ...mockReward, issuedQuantity: 1 }),
      })),
    };

    // Mock constructor and methods
    const mockRewardRequestModel = function() {
      this._id = new Types.ObjectId('6481234567890123456789a4');
      this.save = jest.fn().mockResolvedValue({
        _id: this._id,
        userId,
        eventId: mockEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        status: RewardRequestStatus.PENDING,
        verificationData: { attendanceDate: '2023-05-01' },
        toString: () => this._id.toString()
      });
    };

    // Mock static methods
    mockRewardRequestModel.findById = jest.fn().mockImplementation((id) => {
      if (id === 'nonexistent') {
        return { exec: jest.fn().mockResolvedValue(null) };
      }
      return {
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId('6481234567890123456789a4'),
          userId,
          eventId: mockEvent._id.toString(),
          rewardIds: [mockReward._id.toString()],
          status: RewardRequestStatus.PENDING,
          verificationData: { attendanceDate: '2023-05-01' },
        }),
      };
    });
    
    mockRewardRequestModel.findByIdAndUpdate = jest.fn().mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId('6481234567890123456789a4'),
        userId,
        eventId: mockEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        status: RewardRequestStatus.APPROVED,
        verificationData: { attendanceDate: '2023-05-01' },
      }),
    }));
    
    mockRewardRequestModel.find = jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }));
    
    mockRewardRequestModel.findOne = jest.fn().mockImplementation((query) => {
      // 중복 참여 검사 시 조건에 따라 다른 결과 반환
      if (query && query.eventId === mockEvent._id.toString() && query.userId === userId && !mockEvent.allowMultipleParticipation) {
        // 특별한 테스트 케이스: 중복 참여 검사
        if (query.eventId === 'duplicate') {
          return { exec: jest.fn().mockResolvedValue(mockExistingRequest) };
        }
      }
      return { exec: jest.fn().mockResolvedValue(null) };
    });

    const mockUserRewardModel = {
      create: jest.fn().mockImplementation((data) => ({
        ...data,
        _id: new Types.ObjectId('6491234567890123456789a5'),
        save: jest.fn().mockResolvedValue({
          ...data,
          _id: new Types.ObjectId('6491234567890123456789a5'),
        }),
      })),
      find: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
    };

    const mockEventLogModel = function() {
      this.save = jest.fn().mockResolvedValue({});
    };

    // Add mock for EventParticipation model
    const mockEventParticipationModel = {
      find: jest.fn().mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
      findOne: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
      })),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getModelToken(Event.name),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(Reward.name),
          useValue: mockRewardModel,
        },
        {
          provide: getModelToken(RewardRequest.name),
          useValue: mockRewardRequestModel,
        },
        {
          provide: getModelToken(UserReward.name),
          useValue: mockUserRewardModel,
        },
        {
          provide: getModelToken(EventLog.name),
          useValue: mockEventLogModel,
        },
        {
          provide: getModelToken('EventParticipation'),
          useValue: mockEventParticipationModel,
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    eventModel = module.get<Model<Event>>(getModelToken(Event.name));
    rewardModel = module.get<Model<Reward>>(getModelToken(Reward.name));
    rewardRequestModel = module.get<Model<RewardRequest>>(getModelToken(RewardRequest.name));
    userRewardModel = module.get<Model<UserReward>>(getModelToken(UserReward.name));
    eventLogModel = module.get<Model<EventLog>>(getModelToken(EventLog.name));

    // 이벤트 로그 생성 메서드 모킹
    jest.spyOn(service as any, 'createEventLog').mockResolvedValue(undefined);
    // isuseRewards 메서드 모킹
    jest.spyOn(service as any, 'issueRewards').mockResolvedValue(undefined);
  });

  describe('Reward Request Flow', () => {
    it('should create a reward request', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: mockEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        verificationData: { attendanceDate: '2023-05-01' },
      };

      // Mock the verifyEventCondition private method
      jest.spyOn(service as any, 'verifyEventCondition').mockResolvedValue(true);

      const result = await service.createRewardRequest(createRewardRequestDto, userId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('userId', userId);
      expect(result).toHaveProperty('eventId', mockEvent._id.toString());
    });

    it('should throw NotFoundException when event does not exist', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: 'nonexistent-event-id',
        rewardIds: [mockReward._id.toString()],
        verificationData: { attendanceDate: '2023-05-01' },
      };

      await expect(service.createRewardRequest(createRewardRequestDto, userId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException when event is not active', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: inactiveEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        verificationData: { attendanceDate: '2023-05-01' },
      };

      await expect(service.createRewardRequest(createRewardRequestDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event is expired', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: expiredEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        verificationData: { attendanceDate: '2023-05-01' },
      };

      await expect(service.createRewardRequest(createRewardRequestDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException when event conditions are not met', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = {
        eventId: mockEvent._id.toString(),
        rewardIds: [mockReward._id.toString()],
        verificationData: { attendanceDate: '2023-05-01' },
      };

      // 조건 검증 실패 모킹
      jest.spyOn(service as any, 'verifyEventCondition').mockResolvedValue(false);

      await expect(service.createRewardRequest(createRewardRequestDto, userId))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should approve and issue rewards', async () => {
      const requestId = new Types.ObjectId('6481234567890123456789a4').toString();
      const operatorId = new Types.ObjectId('6471234567890123456789a6').toString();

      const updateRewardRequestDto = {
        status: RewardRequestStatus.APPROVED,
      };

      const result = await service.updateRewardRequest(requestId, updateRewardRequestDto, operatorId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('status', RewardRequestStatus.APPROVED);
      expect(service['issueRewards']).toHaveBeenCalledWith(requestId, operatorId);
    });

    it('should throw NotFoundException when reward request does not exist', async () => {
      const operatorId = new Types.ObjectId('6471234567890123456789a6').toString();
      const updateRewardRequestDto = { status: RewardRequestStatus.APPROVED };

      await expect(service.updateRewardRequest('nonexistent', updateRewardRequestDto, operatorId))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should find a reward request by id', async () => {
      const requestId = new Types.ObjectId('6481234567890123456789a4').toString();
      
      const result = await service.findRewardRequestById(requestId);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
      expect(result).toHaveProperty('userId', userId);
    });

    it('should throw NotFoundException when finding non-existent request', async () => {
      await expect(service.findRewardRequestById('nonexistent'))
        .rejects
        .toThrow(NotFoundException);
    });
  });
}); 