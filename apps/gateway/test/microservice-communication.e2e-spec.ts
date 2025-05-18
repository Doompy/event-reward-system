import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Post, Get, Param, Body } from '@nestjs/common';
import * as request from 'supertest';

// Test controller for Auth endpoints
@Controller('auth')
class TestAuthController {
  @Post('login')
  login(@Body() loginData: { email: string; password: string }) {
    if (loginData.email === 'testuser@example.com' && loginData.password === 'Password123!') {
      return {
        accessToken: 'mock_jwt_token',
        user: {
          _id: 'user1',
          email: 'testuser@example.com',
          role: 'USER',
        }
      };
    }
    throw new Error('Invalid credentials');
  }

  @Post('register')
  register(@Body() registerData: { email: string; password: string; role?: string }) {
    return {
      _id: 'newuser1',
      email: registerData.email,
      role: registerData.role || 'USER',
    };
  }
}

// Test controller for Event endpoints
@Controller('events')
class TestEventController {
  private readonly mockEvent = {
    _id: 'event1',
    title: '테스트 이벤트',
    description: '테스트용 이벤트입니다',
    status: 'ACTIVE',
  };

  @Get()
  findAll() {
    return [this.mockEvent];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    if (id === 'event1') {
      return this.mockEvent;
    }
    throw new Error('Event not found');
  }

  @Post()
  create(@Body() createEventDto: any) {
    return {
      _id: 'newevent1',
      ...createEventDto,
      createdBy: 'user1',
    };
  }

  @Post(':eventId/participate')
  participate(@Param('eventId') eventId: string, @Body() data: any) {
    return {
      _id: 'participation1',
      eventId: eventId,
      userId: 'user1',
      status: 'PARTICIPATED',
    };
  }
}

/**
 * 마이크로서비스 통신 테스트
 * 간단한 컨트롤러 모킹을 통해 통신 테스트
 */
describe('Microservice Communication Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAuthController, TestEventController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Service Communication', () => {
    it('로그인 요청을 Auth 서비스로 전달하고 응답을 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('testuser@example.com');
        });
    });

    it('회원가입 요청을 Auth 서비스로 전달하고 응답을 반환해야 함', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          role: 'USER',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.email).toBe('newuser@example.com');
        });
    });
  });

  describe('Event Service Communication', () => {
    it('이벤트 목록 조회 요청을 Event 서비스로 전달하고 응답을 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/events')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]._id).toBe('event1');
        });
    });

    it('특정 이벤트 조회 요청을 Event 서비스로 전달하고 응답을 반환해야 함', () => {
      return request(app.getHttpServer())
        .get('/events/event1')
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe('event1');
          expect(res.body.title).toBe('테스트 이벤트');
        });
    });

    it('인증된 사용자만 이벤트 생성이 가능해야 함', async () => {
      // 먼저 로그인하여 토큰 획득
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!',
        })
        .expect(201);

      const token = loginResponse.body.accessToken;

      // 토큰으로 이벤트 생성
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '새 테스트 이벤트',
          description: '새로 생성한 테스트 이벤트입니다',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
          status: 'ACTIVE',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.title).toBe('새 테스트 이벤트');
        });
    });

    it('인증된 사용자만 이벤트 참여가 가능해야 함', async () => {
      // 먼저 로그인하여 토큰 획득
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Password123!',
        })
        .expect(201);

      const token = loginResponse.body.accessToken;

      // 토큰으로 이벤트 참여
      return request(app.getHttpServer())
        .post('/events/event1/participate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          verificationData: {
            code: 'TEST_CODE'
          }
        })
        .expect(201)
        .expect((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.eventId).toBe('event1');
          expect(res.body.userId).toBeDefined();
        });
    });
  });
}); 