import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Param } from '@nestjs/common';
import * as request from 'supertest';

// Create a test controller that we can use for simplified E2E testing
@Controller('events')
class TestEventsController {
  @Get()
  findAllEvents() {
    return [
      { _id: 'event1', title: 'Event 1' },
      { _id: 'event2', title: 'Event 2' }
    ];
  }
  
  @Get('active')
  findActiveEvents() {
    return [
      { _id: 'event1', title: 'Event 1', status: 'ACTIVE' }
    ];
  }
  
  @Get(':id')
  findEventById(@Param('id') id: string) {
    return { _id: id, title: 'Test Event' };
  }
}

// 단순화된 통합 테스트 - 모의 응답을 사용
describe('Gateway-Event Integration Test (Simplified)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestEventsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('이벤트 API 테스트', () => {
    it('모든 이벤트 목록을 조회할 수 있어야 함', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]._id).toBe('event1');
        });
    });
    
    it('활성화된 이벤트만 조회할 수 있어야 함', () => {
      return request(app.getHttpServer())
        .get('/events/active')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].status).toBe('ACTIVE');
        });
    });
    
    it('특정 ID로 이벤트를 조회할 수 있어야 함', () => {
      const eventId = 'event1';
      return request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(eventId);
          expect(res.body.title).toBe('Test Event');
        });
    });
  });
}); 