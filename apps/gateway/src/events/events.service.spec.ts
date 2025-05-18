import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { ClientProxy } from '@nestjs/microservices';
import { HealthService } from '../health/health.service';
import { of, throwError } from 'rxjs';

describe('EventsService', () => {
  let service: EventsService;
  let eventClient: ClientProxy;
  let healthService: HealthService;

  beforeEach(async () => {
    const mockClientProxy = {
      send: jest.fn().mockImplementation(() => of({}))
    };

    const mockHealthService = {
      updateServiceStatus: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: 'EVENT_SERVICE',
          useValue: mockClientProxy,
        },
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventClient = module.get<ClientProxy>('EVENT_SERVICE');
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEvent', () => {
    it('should create a new event and update health status', async () => {
      const createEventDto = { title: 'Test Event' };
      const userId = 'user123';
      const expectedResult = { id: 'event1', ...createEventDto };

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.createEvent(createEventDto, userId);

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'create_event' }, { createEventDto, userId }
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors and update health status', async () => {
      const createEventDto = { title: 'Test Event' };
      const userId = 'user123';
      const testError = new Error('Test error');

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => throwError(() => testError));

      await expect(service.createEvent(createEventDto, userId)).rejects.toThrow(testError);
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', false);
    });
  });

  describe('findAllEvents', () => {
    it('should return all events and update health status', async () => {
      const filters = { status: 'ACTIVE' };
      const expectedResult = [{ id: 'event1', title: 'Event 1' }];

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.findAllEvents(filters);

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_all_events' }, filters
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
    
    it('should handle errors when finding all events', async () => {
      const filters = { status: 'ACTIVE' };
      const testError = new Error('Failed to find events');
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => throwError(() => testError));
      
      await expect(service.findAllEvents(filters)).rejects.toThrow(testError);
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', false);
    });
  });

  describe('findActiveEvents', () => {
    it('should return active events and update health status', async () => {
      const expectedResult = [{ id: 'event1', title: 'Active Event' }];

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.findActiveEvents();

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_active_events' }, {}
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
    
    it('should handle errors when finding active events', async () => {
      const testError = new Error('Failed to find active events');
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => throwError(() => testError));
      
      await expect(service.findActiveEvents()).rejects.toThrow(testError);
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', false);
    });
  });
  
  describe('findEventById', () => {
    it('should return an event by id and update health status', async () => {
      const eventId = 'event123';
      const expectedResult = { id: eventId, title: 'Test Event' };
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findEventById(eventId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_event_by_id' }, eventId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
    
    it('should handle errors when finding event by id', async () => {
      const eventId = 'nonexistent';
      const testError = new Error('Event not found');
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => throwError(() => testError));
      
      await expect(service.findEventById(eventId)).rejects.toThrow(testError);
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', false);
    });
  });

  describe('updateEvent', () => {
    it('should update an event and update health status', async () => {
      const eventId = 'event123';
      const updateEventDto = { title: 'Updated Event' };
      const userId = 'user123';
      const expectedResult = { id: eventId, ...updateEventDto };
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.updateEvent(eventId, updateEventDto, userId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'update_event' }, { id: eventId, updateEventDto, userId }
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createReward', () => {
    it('should create a reward and update health status', async () => {
      const createRewardDto = { name: 'Test Reward', eventId: 'event1' };
      const userId = 'user123';
      const expectedResult = { id: 'reward1', ...createRewardDto };

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.createReward(createRewardDto, userId);

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'create_reward' }, { createRewardDto, userId }
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('findRewardsByEventId', () => {
    it('should find rewards by event id and update health status', async () => {
      const eventId = 'event123';
      const expectedResult = [{ id: 'reward1', name: 'Test Reward' }];
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findRewardsByEventId(eventId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_rewards_by_event_id' }, eventId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('findRewardById', () => {
    it('should find a reward by id and update health status', async () => {
      const rewardId = 'reward123';
      const expectedResult = { id: rewardId, name: 'Test Reward' };
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findRewardById(rewardId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_reward_by_id' }, rewardId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createRewardRequest', () => {
    it('should create a reward request and update health status', async () => {
      const createRewardRequestDto = { eventId: 'event1', verificationData: { code: '123' } };
      const userId = 'user123';
      const expectedResult = { id: 'request1', status: 'PENDING' };

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.createRewardRequest(createRewardRequestDto, userId);

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'create_reward_request' }, { createRewardRequestDto, userId }
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('updateRewardRequest', () => {
    it('should update a reward request and update health status', async () => {
      const requestId = 'request123';
      const updateRewardRequestDto = { status: 'APPROVED' };
      const userId = 'user123';
      const expectedResult = { id: requestId, status: 'APPROVED' };
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.updateRewardRequest(requestId, updateRewardRequestDto, userId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'update_reward_request' }, { id: requestId, updateRewardRequestDto, operatorId: userId }
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('findRewardRequestById', () => {
    it('should find a reward request by id and update health status', async () => {
      const requestId = 'request123';
      const expectedResult = { id: requestId, status: 'PENDING' };
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findRewardRequestById(requestId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_reward_request_by_id' }, requestId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findUserRewardsByUserId', () => {
    it('should return user rewards and update health status', async () => {
      const userId = 'user123';
      const expectedResult = [{ id: 'userReward1', userId, name: 'User Reward' }];

      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));

      const result = await service.findUserRewardsByUserId(userId);

      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_user_rewards_by_user_id' }, userId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('findRewardRequestsByUserId', () => {
    it('should find reward requests by user id and update health status', async () => {
      const userId = 'user123';
      const expectedResult = [{ id: 'request1', status: 'PENDING' }];
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findRewardRequestsByUserId(userId);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_reward_requests_by_user_id' }, userId
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
  
  describe('findRewardRequests', () => {
    it('should find all reward requests and update health status', async () => {
      const filters = { status: 'PENDING' };
      const expectedResult = [{ id: 'request1', status: 'PENDING' }];
      
      jest.spyOn(eventClient, 'send').mockImplementationOnce(() => of(expectedResult));
      
      const result = await service.findRewardRequests(filters);
      
      expect(eventClient.send).toHaveBeenCalledWith(
        { cmd: 'find_reward_requests' }, filters
      );
      expect(healthService.updateServiceStatus).toHaveBeenCalledWith('event', true);
      expect(result).toEqual(expectedResult);
    });
  });
}); 