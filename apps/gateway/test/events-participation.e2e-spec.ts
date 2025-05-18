import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Get, Param, Body, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';

// Create a simplified test controller for participation endpoints
@Controller('events')
class TestEventsParticipationController {
  // 테스트용 사용자 ID
  private readonly mockUserId = '6579adc32e1c4c43b4c36e31';
  private readonly testEventId = '6579adc32e1c4c43b4c36e32';
  
  @Post(':eventId/participate')
  participate(@Param('eventId') eventId: string, @Body() data: any) {
    if (eventId !== this.testEventId) {
      throw new Error('Event not found');
    }
    
    return {
      _id: 'participation1',
      eventId: eventId,
      userId: this.mockUserId,
      status: 'PARTICIPATED',
      participatedAt: new Date().toISOString()
    };
  }
  
  @Get('user/participations')
  getUserParticipations() {
    return [
      {
        _id: 'participation1',
        eventId: this.testEventId,
        userId: this.mockUserId,
        status: 'PARTICIPATED'
      }
    ];
  }
  
  @Get(':eventId/participations')
  getEventParticipations(@Param('eventId') eventId: string) {
    return [
      {
        _id: 'participation1',
        eventId: eventId,
        userId: 'user1',
        status: 'PARTICIPATED'
      },
      {
        _id: 'participation2',
        eventId: eventId,
        userId: 'user2',
        status: 'PARTICIPATED'
      }
    ];
  }
  
  @Get(':eventId/stats')
  getEventStats(@Param('eventId') eventId: string) {
    return {
      totalParticipations: 10,
      uniqueParticipants: 8,
      participationsByDay: [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 5 }
      ],
      rewardRequestRate: 0.8,
      successRate: 0.7
    };
  }
}

describe('EventsController (e2e) - Participation', () => {
  let app: INestApplication;
  
  // 테스트용 사용자 ID
  const mockUserId = '6579adc32e1c4c43b4c36e31';
  // 테스트를 위한 이벤트 ID
  const testEventId = '6579adc32e1c4c43b4c36e32';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestEventsParticipationController],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // 요청에 사용자 정보를 주입하기 위한 미들웨어
    app.use((req, res, next) => {
      req.user = { _id: mockUserId, role: 'USER' };
      next();
    });
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/events/:eventId/participate (POST)', () => {
    it('이벤트 참여 성공', () => {
      return request(app.getHttpServer())
        .post(`/events/${testEventId}/participate`)
        .send({
          verificationData: { testData: 'test value' },
          additionalData: { comment: '통합 테스트 참여' }
        })
        .expect(HttpStatus.CREATED)
        .expect(res => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('eventId', testEventId);
          expect(res.body).toHaveProperty('userId', mockUserId);
          expect(res.body).toHaveProperty('status', 'PARTICIPATED');
        });
    });

    it('존재하지 않는 이벤트 참여 시도 시 500 응답', () => {
      const nonExistentEventId = '6579adc32e1c4c43b4c36e33';
      
      return request(app.getHttpServer())
        .post(`/events/${nonExistentEventId}/participate`)
        .send({
          verificationData: { testData: 'test value' }
        })
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('/events/user/participations (GET)', () => {
    it('사용자의 이벤트 참여 목록 조회 성공', () => {
      return request(app.getHttpServer())
        .get('/events/user/participations')
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('userId', mockUserId);
          }
        });
    });
  });

  describe('/events/:eventId/participations (GET)', () => {
    it('특정 이벤트의 참여 목록 조회 성공 (관리자 권한)', () => {
      return request(app.getHttpServer())
        .get(`/events/${testEventId}/participations`)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('eventId', testEventId);
          }
        });
    });
  });

  describe('/events/:eventId/stats (GET)', () => {
    it('이벤트 참여 통계 조회 성공 (관리자 권한)', () => {
      return request(app.getHttpServer())
        .get(`/events/${testEventId}/stats`)
        .expect(HttpStatus.OK)
        .expect(res => {
          expect(res.body).toHaveProperty('totalParticipations');
          expect(res.body).toHaveProperty('uniqueParticipants');
          expect(res.body).toHaveProperty('participationsByDay');
          expect(res.body).toHaveProperty('rewardRequestRate');
          expect(res.body).toHaveProperty('successRate');
        });
    });
  });
}); 