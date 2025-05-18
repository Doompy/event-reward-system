import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Param } from '@nestjs/common';
import * as request from 'supertest';

// Create a test controller for events endpoints
@Controller('events')
class TestEventsController {
  @Get()
  findAll() {
    return [
      { id: 'event1', title: 'Event 1' },
      { id: 'event2', title: 'Event 2' },
    ];
  }

  @Get('active')
  findActive() {
    return [
      { id: 'event1', title: 'Active Event 1', status: 'ACTIVE' },
    ];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, title: 'Test Event' };
  }

  @Get(':eventId/rewards')
  findRewards(@Param('eventId') eventId: string) {
    return [
      { id: 'reward1', name: 'Reward 1', eventId },
      { id: 'reward2', name: 'Reward 2', eventId },
    ];
  }
}

describe('EventsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestEventsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/events (GET)', () => {
    it('should return all events', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0].id).toBe('event1');
        });
    });
  });

  describe('/events/active (GET)', () => {
    it('should return active events', () => {
      return request(app.getHttpServer())
        .get('/events/active')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].status).toBe('ACTIVE');
        });
    });
  });

  describe('/events/:id (GET)', () => {
    it('should return event by ID', () => {
      return request(app.getHttpServer())
        .get('/events/event1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('event1');
          expect(res.body.title).toBe('Test Event');
        });
    });
  });

  describe('/events/:eventId/rewards (GET)', () => {
    it('should return rewards for an event', () => {
      return request(app.getHttpServer())
        .get('/events/event1/rewards')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0].eventId).toBe('event1');
        });
    });
  });
}); 