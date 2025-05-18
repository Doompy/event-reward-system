import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { CreateRewardRequestDto } from './dto/create-reward-request.dto';
import { UpdateRewardRequestDto } from './dto/update-reward-request.dto';
import { RewardRequestStatus, EventStatus } from 'libs/database/schema';
import { EventConditionType } from 'libs/database/schema/event.schema';
import { RewardType } from 'libs/database/schema/reward.schema';

describe('EventController', () => {
  let eventController: EventController;
  let eventService: EventService;

  const mockEventService = {
    createEvent: jest.fn(),
    findAllEvents: jest.fn(),
    findEventById: jest.fn(),
    updateEvent: jest.fn(),
    healthCheck: jest.fn(),
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
    findActiveEvents: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: EventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    eventController = app.get<EventController>(EventController);
    eventService = app.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(eventController).toBeDefined();
  });

  describe('checkHealth', () => {
    it('should return health status', async () => {
      const result = { status: 'ok', timestamp: new Date().toISOString() };
      mockEventService.healthCheck.mockResolvedValue(result);
      
      expect(await eventController.checkHealth()).toBe(result);
      expect(eventService.healthCheck).toHaveBeenCalled();
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const createEventDto: CreateEventDto = { 
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        status: EventStatus.DRAFT,
        conditionType: EventConditionType.ATTENDANCE,
        conditionValue: { count: 1 },
        autoReward: true,
      };
      const userId = 'user123';
      const result = { id: 'event1', ...createEventDto };
      
      mockEventService.createEvent.mockResolvedValue(result);
      
      expect(await eventController.createEvent({ createEventDto, userId })).toBe(result);
      expect(eventService.createEvent).toHaveBeenCalledWith(createEventDto, userId);
    });
  });

  describe('findAllEvents', () => {
    it('should return all events with filters', async () => {
      const filters = { status: 'ACTIVE' };
      const result = [{ id: 'event1', title: 'Test Event' }];
      
      mockEventService.findAllEvents.mockResolvedValue(result);
      
      expect(await eventController.findAllEvents(filters)).toBe(result);
      expect(eventService.findAllEvents).toHaveBeenCalledWith(filters);
    });
  });

  describe('findEventById', () => {
    it('should return an event by id', async () => {
      const eventId = 'event123';
      const result = { id: eventId, title: 'Test Event' };
      
      mockEventService.findEventById.mockResolvedValue(result);
      
      expect(await eventController.findEventById(eventId)).toBe(result);
      expect(eventService.findEventById).toHaveBeenCalledWith(eventId);
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const id = 'event123';
      const updateEventDto: UpdateEventDto = { title: 'Updated Event' };
      const userId = 'user123';
      const result = { id, ...updateEventDto };
      
      mockEventService.updateEvent.mockResolvedValue(result);
      
      expect(await eventController.updateEvent({ id, updateEventDto, userId })).toBe(result);
      expect(eventService.updateEvent).toHaveBeenCalledWith(id, updateEventDto, userId);
    });
  });

  describe('createReward', () => {
    it('should create a reward', async () => {
      const createRewardDto: CreateRewardDto = { 
        name: 'Test Reward', 
        eventId: 'event123',
        type: RewardType.POINT,
        value: '100',
        totalQuantity: 10
      };
      const userId = 'user123';
      const result = { id: 'reward1', ...createRewardDto };
      
      mockEventService.createReward.mockResolvedValue(result);
      
      expect(await eventController.createReward({ createRewardDto, userId })).toBe(result);
      expect(eventService.createReward).toHaveBeenCalledWith(createRewardDto, userId);
    });
  });

  describe('findRewardsByEventId', () => {
    it('should return rewards by event id', async () => {
      const eventId = 'event123';
      const result = [{ id: 'reward1', name: 'Test Reward' }];
      
      mockEventService.findRewardsByEventId.mockResolvedValue(result);
      
      expect(await eventController.findRewardsByEventId(eventId)).toBe(result);
      expect(eventService.findRewardsByEventId).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findRewardById', () => {
    it('should return a reward by id', async () => {
      const rewardId = 'reward123';
      const result = { id: rewardId, name: 'Test Reward' };
      
      mockEventService.findRewardById.mockResolvedValue(result);
      
      expect(await eventController.findRewardById(rewardId)).toBe(result);
      expect(eventService.findRewardById).toHaveBeenCalledWith(rewardId);
    });
  });

  describe('updateReward', () => {
    it('should update a reward', async () => {
      const id = 'reward123';
      const updateRewardDto: UpdateRewardDto = { name: 'Updated Reward' };
      const userId = 'user123';
      const result = { id, ...updateRewardDto };
      
      mockEventService.updateReward.mockResolvedValue(result);
      
      expect(await eventController.updateReward({ id, updateRewardDto, userId })).toBe(result);
      expect(eventService.updateReward).toHaveBeenCalledWith(id, updateRewardDto, userId);
    });
  });

  describe('createRewardRequest', () => {
    it('should create a reward request', async () => {
      const createRewardRequestDto: CreateRewardRequestDto = { 
        eventId: 'event123',
        rewardIds: ['reward1', 'reward2'],
        verificationData: { code: '123' } 
      };
      const userId = 'user123';
      const result = { id: 'request1', status: 'PENDING' };
      
      mockEventService.createRewardRequest.mockResolvedValue(result);
      
      expect(await eventController.createRewardRequest({ createRewardRequestDto, userId })).toBe(result);
      expect(eventService.createRewardRequest).toHaveBeenCalledWith(createRewardRequestDto, userId);
    });
  });

  describe('updateRewardRequest', () => {
    it('should update a reward request', async () => {
      const id = 'request123';
      const updateRewardRequestDto: UpdateRewardRequestDto = { 
        status: RewardRequestStatus.APPROVED 
      };
      const operatorId = 'user123';
      const result = { id, status: 'APPROVED' };
      
      mockEventService.updateRewardRequest.mockResolvedValue(result);
      
      expect(await eventController.updateRewardRequest({ id, updateRewardRequestDto, operatorId })).toBe(result);
      expect(eventService.updateRewardRequest).toHaveBeenCalledWith(id, updateRewardRequestDto, operatorId);
    });
  });

  describe('findRewardRequestById', () => {
    it('should return a reward request by id', async () => {
      const requestId = 'request123';
      const result = { id: requestId, status: 'PENDING' };
      
      mockEventService.findRewardRequestById.mockResolvedValue(result);
      
      expect(await eventController.findRewardRequestById(requestId)).toBe(result);
      expect(eventService.findRewardRequestById).toHaveBeenCalledWith(requestId);
    });
  });

  describe('findRewardRequestsByUserId', () => {
    it('should return reward requests by user id', async () => {
      const userId = 'user123';
      const result = [{ id: 'request1', status: 'PENDING' }];
      
      mockEventService.findRewardRequestsByUserId.mockResolvedValue(result);
      
      expect(await eventController.findRewardRequestsByUserId(userId)).toBe(result);
      expect(eventService.findRewardRequestsByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('findRewardRequests', () => {
    it('should return all reward requests with filters', async () => {
      const filters = { status: 'PENDING' };
      const result = [{ id: 'request1', status: 'PENDING' }];
      
      mockEventService.findRewardRequests.mockResolvedValue(result);
      
      expect(await eventController.findRewardRequests(filters)).toBe(result);
      expect(eventService.findRewardRequests).toHaveBeenCalledWith(filters);
    });
  });

  describe('findUserRewardsByUserId', () => {
    it('should return user rewards by user id', async () => {
      const userId = 'user123';
      const result = [{ id: 'userReward1', rewardId: 'reward1' }];
      
      mockEventService.findUserRewardsByUserId.mockResolvedValue(result);
      
      expect(await eventController.findUserRewardsByUserId(userId)).toBe(result);
      expect(eventService.findUserRewardsByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
