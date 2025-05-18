import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// Mock UserRole enum to avoid path resolution issues
enum UserRole {
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  AUDITOR = 'AUDITOR',
  ADMIN = 'ADMIN',
}

// Mock RewardRequestStatus enum
enum RewardRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED',
}

// create mocks for the guards
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllEvents', () => {
    it('should return an array of events', async () => {
      const result = ['test'];
      mockEventsService.findAllEvents.mockResolvedValue(result);

      expect(await controller.findAllEvents({})).toBe(result);
      expect(service.findAllEvents).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockEventsService.findAllEvents.mockRejectedValue(new Error('Test error'));

      await expect(controller.findAllEvents({})).rejects.toThrow(HttpException);
    });
  });

  describe('findActiveEvents', () => {
    it('should return active events', async () => {
      const result = ['active event'];
      mockEventsService.findActiveEvents.mockResolvedValue(result);

      expect(await controller.findActiveEvents()).toBe(result);
      expect(service.findActiveEvents).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      mockEventsService.findActiveEvents.mockRejectedValue(new Error('Server error'));
      
      await expect(controller.findActiveEvents()).rejects.toThrow(HttpException);
    });
  });

  describe('findEventById', () => {
    it('should return an event by id', async () => {
      const result = { id: 'eventId', title: 'Event Title' };
      mockEventsService.findEventById.mockResolvedValue(result);

      expect(await controller.findEventById('eventId')).toBe(result);
      expect(service.findEventById).toHaveBeenCalledWith('eventId');
    });

    it('should handle not found errors', async () => {
      mockEventsService.findEventById.mockRejectedValue(new Error('Event not found'));
      
      await expect(controller.findEventById('nonexistentId')).rejects.toThrow(HttpException);
    });
  });

  describe('createEvent', () => {
    it('should create an event', async () => {
      const createEventDto = { title: 'New Event' };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'eventId', ...createEventDto };
      
      mockEventsService.createEvent.mockResolvedValue(result);

      expect(await controller.createEvent(createEventDto, req)).toBe(result);
      expect(service.createEvent).toHaveBeenCalledWith(createEventDto, 'userId');
    });

    it('should handle creation errors', async () => {
      const createEventDto = { title: 'New Event' };
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.createEvent.mockRejectedValue(new Error('Creation failed'));
      
      await expect(controller.createEvent(createEventDto, req)).rejects.toThrow(HttpException);
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const updateEventDto = { title: 'Updated Event' };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'eventId', ...updateEventDto };
      
      mockEventsService.updateEvent.mockResolvedValue(result);

      expect(await controller.updateEvent('eventId', updateEventDto, req)).toBe(result);
      expect(service.updateEvent).toHaveBeenCalledWith('eventId', updateEventDto, 'userId');
    });

    it('should handle update errors', async () => {
      const updateEventDto = { title: 'Updated Event' };
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.updateEvent.mockRejectedValue(new Error('Update failed'));
      
      await expect(controller.updateEvent('eventId', updateEventDto, req)).rejects.toThrow(HttpException);
    });
  });

  describe('findRewardsByEventId', () => {
    it('should return rewards by event id', async () => {
      const result = [{ id: 'rewardId', name: 'Reward Name' }];
      mockEventsService.findRewardsByEventId.mockResolvedValue(result);

      expect(await controller.findRewardsByEventId('eventId')).toBe(result);
      expect(service.findRewardsByEventId).toHaveBeenCalledWith('eventId');
    });

    it('should handle errors when finding rewards', async () => {
      mockEventsService.findRewardsByEventId.mockRejectedValue(new Error('Failed to find rewards'));
      
      await expect(controller.findRewardsByEventId('eventId')).rejects.toThrow(HttpException);
    });
  });

  describe('createReward', () => {
    it('should create a reward for an event', async () => {
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
    it('should find a reward by id', async () => {
      const rewardId = 'rewardId';
      const result = { id: rewardId, name: 'Test Reward' };
      
      mockEventsService.findRewardById.mockResolvedValue(result);
      
      expect(await controller.findRewardById(rewardId)).toBe(result);
      expect(service.findRewardById).toHaveBeenCalledWith(rewardId);
    });
  });

  describe('updateReward', () => {
    it('should update a reward', async () => {
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
    it('should create a reward request', async () => {
      const verificationData = { code: '12345' };
      const req = { user: { _id: 'userId' } };
      const result = { id: 'requestId', status: 'PENDING' };
      
      mockEventsService.createRewardRequest.mockResolvedValue(result);

      expect(await controller.createRewardRequest('eventId', verificationData, req)).toBe(result);
      expect(service.createRewardRequest).toHaveBeenCalledWith(
        { eventId: 'eventId', verificationData }, 
        'userId'
      );
    });
  });

  describe('updateRewardRequest', () => {
    it('should update a reward request', async () => {
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
    it('should return a reward request by id for ADMIN', async () => {
      const request = { id: 'requestId', userId: 'otherUserId' };
      const req = { user: { _id: 'adminId', role: UserRole.ADMIN } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      expect(await controller.findRewardRequestById('requestId', req)).toBe(request);
      expect(service.findRewardRequestById).toHaveBeenCalledWith('requestId');
    });

    it('should return a reward request by id for the request owner', async () => {
      const request = { id: 'requestId', userId: { toString: () => 'userId' } };
      const req = { user: { _id: 'userId', role: UserRole.USER } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      expect(await controller.findRewardRequestById('requestId', req)).toBe(request);
      expect(service.findRewardRequestById).toHaveBeenCalledWith('requestId');
    });

    it('should throw forbidden error when USER tries to access others request', async () => {
      const request = { id: 'requestId', userId: { toString: () => 'otherUserId' } };
      const req = { user: { _id: 'userId', role: UserRole.USER } };
      
      mockEventsService.findRewardRequestById.mockResolvedValue(request);

      await expect(controller.findRewardRequestById('requestId', req))
        .rejects
        .toThrow(HttpException);
    });
  });

  describe('findMyRewardRequests', () => {
    it('should return user reward requests', async () => {
      const result = [{ id: 'requestId', status: RewardRequestStatus.PENDING }];
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findRewardRequestsByUserId.mockResolvedValue(result);
      
      expect(await controller.findMyRewardRequests(req)).toBe(result);
      expect(service.findRewardRequestsByUserId).toHaveBeenCalledWith('userId');
    });
  });

  describe('findRewardRequests', () => {
    it('should return all reward requests for operators', async () => {
      const filters = { status: RewardRequestStatus.PENDING };
      const result = [{ id: 'requestId', status: RewardRequestStatus.PENDING }];
      
      mockEventsService.findRewardRequests.mockResolvedValue(result);
      
      expect(await controller.findRewardRequests(filters)).toBe(result);
      expect(service.findRewardRequests).toHaveBeenCalledWith(filters);
    });
  });

  describe('findMyRewards', () => {
    it('should return user rewards', async () => {
      const result = [{ id: 'rewardId', name: 'User Reward' }];
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findUserRewardsByUserId.mockResolvedValue(result);

      expect(await controller.findMyRewards(req)).toBe(result);
      expect(service.findUserRewardsByUserId).toHaveBeenCalledWith('userId');
    });

    it('should handle errors when finding user rewards', async () => {
      const req = { user: { _id: 'userId' } };
      
      mockEventsService.findUserRewardsByUserId.mockRejectedValue(new Error('Failed to find rewards'));
      
      await expect(controller.findMyRewards(req)).rejects.toThrow(HttpException);
    });
  });
}); 