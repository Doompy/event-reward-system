import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// 경로 해결 문제를 피하기 위한 UserRole 열거형 모킹
enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

// RewardRequestStatus 열거형 모킹
enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED',
}

// 가드 모킹 생성
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockRolesGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  const mockEventsService = {
    createEvent: jest.fn(),
    findAllEvents: jest.fn(),
    findActiveEvents: jest.fn(),
    findEventById: jest.fn(),
    updateEvent: jest.fn(),
    createReward: jest.fn(),
    findRewardsByEventId: jest.fn(),
    findRewardById: jest.fn(),
    updateReward: jest.fn(),
    createRewardRequest: jest.fn(),
    updateRewardRequest: jest.fn(),
    findRewardRequestById: jest.fn(),
    findRewardRequestsByUserId: jest.fn(),
    findRewardRequests: jest.fn(),
    findUserRewardsByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard
        },
        {
          provide: RolesGuard,
          useValue: mockRolesGuard
        }
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtAuthGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('컨트롤러가 정의되어야 함', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllEvents', () => {
    it('이벤트 배열을 반환해야 함', async () => {
      const result = ['test'];
      mockEventsService.findAllEvents.mockResolvedValue(result);

      expect(await controller.findAllEvents({})).toBe(result);
      expect(service.findAllEvents).toHaveBeenCalled();
    });

    it('오류를 처리해야 함', async () => {
      mockEventsService.findAllEvents.mockRejectedValue(new Error('Test error'));

      await expect(controller.findAllEvents({})).rejects.toThrow(HttpException);
    });
  });

  describe('findActiveEvents', () => {
    it('활성화된 이벤트를 반환해야 함', async () => {
      const result = ['active event'];
      mockEventsService.findActiveEvents.mockResolvedValue(result);

      expect(await controller.findActiveEvents()).toBe(result);
      expect(service.findActiveEvents).toHaveBeenCalled();
    });

    it('오류를 처리해야 함', async () => {
      mockEventsService.findActiveEvents.mockRejectedValue(new Error('Server error'));
      
      await expect(controller.findActiveEvents()).rejects.toThrow(HttpException);
    });
  });

  describe('findEventById', () => {
    it('ID로 이벤트를 반환해야 함', async () => {
      const result = { id: 'eventId', title: 'Event Title' };
      mockEventsService.findEventById.mockResolvedValue(result);

      expect(await controller.findEventById('eventId')).toBe(result);
      expect(service.findEventById).toHaveBeenCalledWith('eventId');
    });

    it('이벤트를 찾을 수 없을 때 오류를 처리해야 함', async () => {
      mockEventsService.findEventById.mockRejectedValue(new Error('Event not found'));
      
      await expect(controller.findEventById('nonexistentId')).rejects.toThrow(HttpException);
    });
  });

  describe('createEvent', () => {
    it('이벤트를 생성해야 함', async () => {
      const createEventDto = { title: 'New Event' };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'eventId', ...createEventDto };
      
      mockEventsService.createEvent.mockResolvedValue(result);

      expect(await controller.createEvent(createEventDto, req)).toBe(result);
      expect(service.createEvent).toHaveBeenCalledWith(createEventDto, 'userId');
    });

    it('생성 오류를 처리해야 함', async () => {
      const createEventDto = { title: 'New Event' };
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.createEvent.mockRejectedValue(new Error('Creation failed'));
      
      await expect(controller.createEvent(createEventDto, req)).rejects.toThrow(HttpException);
    });
  });

  describe('updateEvent', () => {
    it('이벤트를 업데이트해야 함', async () => {
      const updateEventDto = { title: 'Updated Event' };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'eventId', ...updateEventDto };
      
      mockEventsService.updateEvent.mockResolvedValue(result);

      expect(await controller.updateEvent('eventId', updateEventDto, req)).toBe(result);
      expect(service.updateEvent).toHaveBeenCalledWith('eventId', updateEventDto, 'userId');
    });

    it('업데이트 오류를 처리해야 함', async () => {
      const updateEventDto = { title: 'Updated Event' };
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.updateEvent.mockRejectedValue(new Error('Update failed'));
      
      await expect(controller.updateEvent('eventId', updateEventDto, req)).rejects.toThrow(HttpException);
    });
  });

  describe('findRewardsByEventId', () => {
    it('이벤트 ID로 보상을 반환해야 함', async () => {
      const result = [{ id: 'rewardId', name: 'Reward Name' }];
      mockEventsService.findRewardsByEventId.mockResolvedValue(result);

      expect(await controller.findRewardsByEventId('eventId')).toBe(result);
      expect(service.findRewardsByEventId).toHaveBeenCalledWith('eventId');
    });

    it('보상을 찾을 때 오류를 처리해야 함', async () => {
      mockEventsService.findRewardsByEventId.mockRejectedValue(new Error('Failed to find rewards'));
      
      await expect(controller.findRewardsByEventId('eventId')).rejects.toThrow(HttpException);
    });
  });

  describe('createReward', () => {
    it('이벤트에 대한 보상을 생성해야 함', async () => {
      const eventId = 'eventId';
      const createRewardDto = { name: 'New Reward', value: '100' };
      const req = { user: { _id: 'operatorId' } };
      const result = { id: 'rewardId', eventId, ...createRewardDto };
      
      mockEventsService.createReward.mockResolvedValue(result);
      
      expect(await controller.createReward(eventId, createRewardDto, req)).toBe(result);
      expect(service.createReward).toHaveBeenCalledWith(
        expect.objectContaining({ eventId, ...createRewardDto }), 
        'operatorId'
      );
    });
  });

  describe('findRewardById', () => {
    it('ID로 보상을 찾아야 함', async () => {
      const rewardId = 'rewardId';
      const result = { id: rewardId, name: 'Test Reward' };
      
      mockEventsService.findRewardById.mockResolvedValue(result);
      
      expect(await controller.findRewardById(rewardId)).toBe(result);
      expect(service.findRewardById).toHaveBeenCalledWith(rewardId);
    });
  });

  describe('updateReward', () => {
    it('보상을 업데이트해야 함', async () => {
      const rewardId = 'rewardId';
      const updateRewardDto = { name: 'Updated Reward' };
      const req = { user: { _id: 'operatorId' } };
      const result = { id: rewardId, ...updateRewardDto };
      
      mockEventsService.updateReward.mockResolvedValue(result);
      
      expect(await controller.updateReward(rewardId, updateRewardDto, req)).toBe(result);
      expect(service.updateReward).toHaveBeenCalledWith(rewardId, updateRewardDto, 'operatorId');
    });
  });

  describe('createRewardRequest', () => {
    it('보상 요청을 생성해야 함', async () => {
      const body = {
        rewardIds: ['reward1', 'reward2'],
        verificationData: { code: '12345' }
      };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'requestId', status: 'PENDING' };
      
      mockEventsService.createRewardRequest.mockResolvedValue(result);

      expect(await controller.createRewardRequest('eventId', body, req)).toBe(result);
      expect(service.createRewardRequest).toHaveBeenCalledWith(
        { 
          eventId: 'eventId', 
          rewardIds: ['reward1', 'reward2'],
          verificationData: { code: '12345' } 
        }, 
        'userId'
      );
    });
  });

  describe('updateRewardRequest', () => {
    it('보상 요청을 업데이트해야 함', async () => {
      const requestId = 'requestId';
      const updateRewardRequestDto = { status: RewardRequestStatus.APPROVED };
      const req = { user: { _id: 'operatorId' } };
      const result = { id: requestId, status: RewardRequestStatus.APPROVED };
      
      mockEventsService.updateRewardRequest.mockResolvedValue(result);
      
      expect(await controller.updateRewardRequest(requestId, updateRewardRequestDto, req)).toBe(result);
      expect(service.updateRewardRequest).toHaveBeenCalledWith(requestId, updateRewardRequestDto, 'operatorId');
    });
  });

  describe('findRewardRequestById', () => {
    it('관리자를 위해 ID로 보상 요청을 반환해야 함', async () => {
      const request = { id: 'requestId', userId: 'otherUserId' };
      const req = { user: { _id: 'adminId', role: UserRole.ADMIN } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      expect(await controller.findRewardRequestById('requestId', req)).toBe(request);
      expect(service.findRewardRequestById).toHaveBeenCalledWith('requestId');
    });

    it('요청 소유자를 위해 ID로 보상 요청을 반환해야 함', async () => {
      const request = { id: 'requestId', userId: { toString: () => 'userId' } };
      const req = { user: { _id: 'userId', role: UserRole.USER } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      expect(await controller.findRewardRequestById('requestId', req)).toBe(request);
      expect(service.findRewardRequestById).toHaveBeenCalledWith('requestId');
    });

    it('일반 사용자가 다른 사람의 요청에 접근할 때 금지 오류를 발생시켜야 함', async () => {
      const request = { id: 'requestId', userId: { toString: () => 'otherUserId' } };
      const req = { user: { _id: 'userId', role: UserRole.USER } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      await expect(controller.findRewardRequestById('requestId', req))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('findMyRewardRequests', () => {
    it('사용자 보상 요청을 반환해야 함', async () => {
      const result = [{ id: 'requestId', status: RewardRequestStatus.PENDING }];
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findRewardRequestsByUserId.mockResolvedValue(result);
      
      expect(await controller.findMyRewardRequests(req)).toBe(result);
      expect(service.findRewardRequestsByUserId).toHaveBeenCalledWith('userId');
    });
  });

  describe('findRewardRequests', () => {
    it('운영자를 위해 모든 보상 요청을 반환해야 함', async () => {
      const filters = { status: RewardRequestStatus.PENDING };
      const result = [{ id: 'requestId', status: RewardRequestStatus.PENDING }];
      
      mockEventsService.findRewardRequests.mockResolvedValue(result);
      
      expect(await controller.findRewardRequests(filters)).toBe(result);
      expect(service.findRewardRequests).toHaveBeenCalledWith(filters);
    });
  });

  describe('findMyRewards', () => {
    it('사용자 보상을 반환해야 함', async () => {
      const result = [{ id: 'rewardId', name: 'User Reward' }];
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findUserRewardsByUserId.mockResolvedValue(result);

      expect(await controller.findMyRewards(req)).toBe(result);
      expect(service.findUserRewardsByUserId).toHaveBeenCalledWith('userId');
    });

    it('사용자 보상을 찾을 때 오류를 처리해야 함', async () => {
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findUserRewardsByUserId.mockRejectedValue(new Error('Failed to find rewards'));
      
      await expect(controller.findMyRewards(req)).rejects.toThrow(HttpException);
    });
  });
}); 